// src/controllers/azureTerraformController.js
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fsPromises } from 'fs';
import fs from 'fs';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import AzureCredential from '../models/azureCredentialModel.js';
import { decrypt } from '../utils/encrypt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TERRAFORM_DIR = path.resolve(__dirname, '..', '..', '..', 'terraform-azure');
const LOGS_DIR = path.join(__dirname, '..', 'logs');

const deployments = new Map();

await fsPromises.mkdir(LOGS_DIR, { recursive: true }).catch(console.error);

/**
 * Fetch and decrypt Azure credentials
 */
async function getAzureAccountById(id) {
  try {
    const credential = await AzureCredential.findById(id).lean();
    if (!credential) return null;

    let decryptedSecret = null;
    if (credential.clientSecret && typeof credential.clientSecret === 'object') {
      try {
        decryptedSecret = decrypt(credential.clientSecret);
      } catch (err) {
        console.error('Decryption failed:', err.message);
        return null;
      }
    }

    return {
      ...credential,
      clientSecret: decryptedSecret,
      _id: credential._id.toString(),
    };
  } catch (err) {
    console.error('DB error:', err);
    return null;
  }
}

/**
 * Safely quote a string for .tfvars
 */
function quoteTfVar(value) {
  if (typeof value !== 'string') return JSON.stringify(value);
  const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `"${escaped}"`;
}

/**
 * Write terraform.tfvars based on UI input — NO SANITIZATION beyond .trim()
 */
async function writeGlobalTfvars(moduleConfig, region, subscriptionId) {
  const tfvarsPath = path.join(TERRAFORM_DIR, 'terraform.tfvars');
  const lines = [];

  const azureRegionMap = {
    'us-east-1': 'westus',
    'us-east-2': 'eastus2',
    'us-west-1': 'westus',
    'us-west-2': 'westus2',
    'eu-west-1': 'westeurope',
    'eu-central-1': 'germanywestcentral',
    'ap-south-1': 'centralindia',
    'ap-southeast-1': 'southeastasia',
    'ap-southeast-2': 'australiaeast',
  };


  const azureLocation = azureRegionMap[region] || region;

  if (azureLocation) {
    lines.push(`location = ${quoteTfVar(azureLocation)}`);
  }
  if (subscriptionId) {
    lines.push(`subscription_id = ${quoteTfVar(subscriptionId)}`);
  }

  // Determine base name
  let baseName = "deploy";
  const moduleName = Object.keys(moduleConfig || {})[0];

  // Handle VNet
  if (moduleName === 'vnet' && moduleConfig.vnet) {
    const vnet = moduleConfig.vnet;
    if (vnet.name?.trim()) {
      baseName = vnet.name.trim();
      lines.push(`vnet_name = ${quoteTfVar(baseName)}`);
    }
    if (vnet.cidrBlock?.trim()) {
      lines.push(`vnet_address_space = ${quoteTfVar(vnet.cidrBlock.trim())}`);
    }
    if (typeof vnet.subnetCount === 'number') {
      lines.push(`subnet_count = ${vnet.subnetCount}`);
    }
  }
  // Other modules: use their 'name' field
  else if (moduleName && moduleConfig[moduleName]?.name?.trim()) {
    baseName = moduleConfig[moduleName].name.trim();
  }

  const rgName = `${baseName}-rg`;
  lines.push(`resource_group_name = ${quoteTfVar(rgName)}`);
  lines.push(`prefix = ${quoteTfVar(baseName)}`);

  if (moduleName) {
    lines.push(`module_to_deploy = ${quoteTfVar(moduleName)}`);
  }

  // ===== STORAGE ACCOUNT =====
  if (moduleName === 'storage_account' && moduleConfig.storage_account) {
    const sc = moduleConfig.storage_account;
    const resourceName = (sc.name || "storage").trim();
    lines.push(`resource_name = ${quoteTfVar(resourceName)}`);
    if (sc.performance) lines.push(`performance = ${quoteTfVar(sc.performance.trim())}`);
    if (sc.redundancy) lines.push(`redundancy = ${quoteTfVar(sc.redundancy.trim())}`);
    if (sc.encryption) lines.push(`encryption = ${quoteTfVar(sc.encryption.trim())}`);
    if (sc.accessControl) lines.push(`access_control = ${quoteTfVar(sc.accessControl.trim())}`);
  }

  // ===== BLOB STORAGE =====
  if ((moduleName === 'blob' || moduleName === 'blob_storage') && (moduleConfig.blob || moduleConfig.blob_storage)) {
    const blob = moduleConfig.blob || moduleConfig.blob_storage;
    const resourceName = (blob.name || "blobstorage").trim();
    lines.push(`resource_name = ${quoteTfVar(resourceName)}`);
    if (blob.storageTier) lines.push(`storage_tier = ${quoteTfVar(blob.storageTier.trim())}`);
    if (blob.redundancy) lines.push(`redundancy = ${quoteTfVar(blob.redundancy.trim())}`);
    if (blob.encryption) lines.push(`encryption = ${quoteTfVar(blob.encryption.trim())}`);
    if (blob.accessControl) lines.push(`access_control = ${quoteTfVar(blob.accessControl.trim())}`);
    if (blob.generateAccessKey !== undefined) {
      lines.push(`generate_access_key = ${blob.generateAccessKey}`);
    }
  }

  // ===== COSMOS DB =====
  if (moduleName === 'cosmos_db' && moduleConfig.cosmos_db) {
    const cosmos = moduleConfig.cosmos_db;
    const accountName = (cosmos.name || "cosmosdb").trim();
    lines.push(`cosmosdb_account_name = ${quoteTfVar(accountName)}`);
    if (cosmos.databaseName) lines.push(`cosmosdb_database_name = ${quoteTfVar(cosmos.databaseName.trim())}`);
    if (cosmos.containerName) lines.push(`cosmosdb_container_name = ${quoteTfVar(cosmos.containerName.trim())}`);
    if (cosmos.partitionKey !== undefined) {
      lines.push(`cosmosdb_partition_key = ${quoteTfVar((cosmos.partitionKey || "/id").trim())}`);
    }
    if (cosmos.consistencyLevel) lines.push(`cosmosdb_consistency_level = ${quoteTfVar(cosmos.consistencyLevel.trim())}`);
  }

  // ===== KEY VAULT =====
  if (moduleName === 'key_vault' && moduleConfig.key_vault) {
    const kv = moduleConfig.key_vault;
    const vaultName = (kv.name || "keyvault").trim();
    lines.push(`key_vault_name = ${quoteTfVar(vaultName)}`);
    if (kv.skuName) lines.push(`key_vault_sku = ${quoteTfVar(kv.skuName.trim())}`);
    if (typeof kv.softDeleteRetentionDays === 'number') {
      lines.push(`key_vault_soft_delete_retention_days = ${kv.softDeleteRetentionDays}`);
    }
    if (kv.purgeProtectionEnabled !== undefined) {
      lines.push(`key_vault_purge_protection = ${kv.purgeProtectionEnabled}`);
    }
  }

  // ===== AKS =====
  if (moduleName === 'aks' && moduleConfig.aks) {
    const aks = moduleConfig.aks;
    if (aks.clusterName) lines.push(`cluster_name = ${quoteTfVar(aks.clusterName.trim())}`);
    if (typeof aks.nodeCount === 'number') lines.push(`node_count = ${aks.nodeCount}`);
    if (aks.vmSize) lines.push(`vm_size = ${quoteTfVar(aks.vmSize.trim())}`);
    if (aks.vnet) lines.push(`vnet_id = ${quoteTfVar(aks.vnet.trim())}`);
    if (aks.subnet) lines.push(`subnet_ids = [${quoteTfVar(aks.subnet.trim())}]`);
  }

  // ===== VM =====
  if (moduleName === 'vm' && moduleConfig.vm) {
    const vm = moduleConfig.vm;
    if (vm.name) lines.push(`vm_name = ${quoteTfVar(vm.name.trim())}`);
    if (vm.vmSize) lines.push(`vm_size = ${quoteTfVar(vm.vmSize.trim())}`);
    if (vm.osImage) lines.push(`os_image = ${quoteTfVar(vm.osImage.trim())}`);
    if (vm.publicIp) {
      const method = vm.publicIp === 'static' ? 'Static' : 'Dynamic';
      lines.push(`public_ip_allocation_method = ${quoteTfVar(method)}`);
    }
    if (vm.sshKey) lines.push(`admin_ssh_key = ${quoteTfVar(vm.sshKey.trim())}`);
    if (vm.vnet) lines.push(`vnet_id = ${quoteTfVar(vm.vnet.trim())}`);
    if (vm.subnet) lines.push(`subnet_id = ${quoteTfVar(vm.subnet.trim())}`);
  }

  // ===== APPLICATION INSIGHTS =====
  if (moduleName === 'application_insights' && moduleConfig.application_insights) {
    const ai = moduleConfig.application_insights;
    const name = (ai.name || "appinsights").trim();
    lines.push(`prefix = ${quoteTfVar(name)}`); // because your .tf uses "${var.prefix}-appinsights"
    if (ai.retentionDays) lines.push(`retention_in_days = ${parseInt(ai.retentionDays)}`);
    if (ai.workspaceId?.trim()) lines.push(`workspace_id = ${quoteTfVar(ai.workspaceId.trim())}`);
}

  // ===== AZURE AD APPLICATION =====
  if (moduleName === 'azure_ad' && moduleConfig.azure_ad) {
    const ad = moduleConfig.azure_ad;
    const displayName = (ad.displayName || "my-app").trim();
    lines.push(`aad_app_display_name = ${quoteTfVar(displayName)}`);
    if (ad.homepageUrl?.trim()) lines.push(`aad_app_homepage_url = ${quoteTfVar(ad.homepageUrl.trim())}`);
    if (ad.replyUrls?.trim()) {
      const urls = ad.replyUrls.split(',').map(u => u.trim()).filter(Boolean);
      const quotedUrls = urls.map(u => quoteTfVar(u)).join(', ');
      lines.push(`aad_app_reply_urls = [${quotedUrls}]`);
    }
  }

  // ===== ADVISOR ALERT (AZURE ADVISOR) =====
  if (moduleName === 'advisor_alert' && moduleConfig.advisor_alert) {
    const adv = moduleConfig.advisor_alert;
    if (adv.adminEmail?.trim()) lines.push(`admin_email = ${quoteTfVar(adv.adminEmail.trim())}`);
    if (adv.slackWebhookUrl?.trim()) lines.push(`slack_webhook_url = ${quoteTfVar(adv.slackWebhookUrl.trim())}`);
  }

  // ===== LOGIC APP =====
  if (moduleName === 'logic_app' && moduleConfig.logic_app) {
    const la = moduleConfig.logic_app;
    const name = (la.name || "logicapp").trim();
    lines.push(`logic_app_name = ${quoteTfVar(name)}`);
    if (la.recurrenceFrequency?.trim()) lines.push(`logic_app_recurrence_frequency = ${quoteTfVar(la.recurrenceFrequency.trim())}`);
    if (la.recurrenceInterval) lines.push(`logic_app_recurrence_interval = ${parseInt(la.recurrenceInterval)}`);
    if (la.httpEndpoint?.trim()) lines.push(`logic_app_http_endpoint = ${quoteTfVar(la.httpEndpoint.trim())}`);
    if (la.logAnalyticsWorkspaceId?.trim()) lines.push(`logic_app_log_analytics_workspace_id = ${quoteTfVar(la.logAnalyticsWorkspaceId.trim())}`);
  }

  // ===== EVENT GRID =====
  if (moduleName === 'event_grid' && moduleConfig.event_grid) {
    const eg = moduleConfig.event_grid;
    const name = (eg.name || "eventgrid-topic").trim();
    lines.push(`event_grid_topic_name = ${quoteTfVar(name)}`);
    if (eg.webhookEndpoint?.trim()) lines.push(`event_grid_webhook_endpoint = ${quoteTfVar(eg.webhookEndpoint.trim())}`);
  }

  // ===== LOG ANALYTICS WORKSPACE =====
  if (moduleName === 'log_analytics' && moduleConfig.log_analytics) {
    const la = moduleConfig.log_analytics;
    const name = (la.name || "loganalytics").trim();
    lines.push(`log_analytics_workspace_name = ${quoteTfVar(name)}`);
    if (la.sku?.trim()) lines.push(`log_analytics_sku = ${quoteTfVar(la.sku.trim())}`);
    if (la.retentionDays) lines.push(`log_analytics_retention_days = ${parseInt(la.retentionDays)}`);
  }

  // ===== MICROSOFT DEFENDER (SECURITY CENTER) =====
  if (moduleName === 'microsoft_defender' && moduleConfig.microsoft_defender) {
    const md = moduleConfig.microsoft_defender;
    const tier = (md.tier || "Standard").trim();
    lines.push(`security_center_tier = ${quoteTfVar(tier)}`);
  }

  // Note: azure_queue_storage is not explicitly handled here.
  // If needed, extend storage_account with queue_enabled = true, or add a dedicated handler.

  const content = lines.join('\n') + '\n';
  await fsPromises.writeFile(tfvarsPath, content, 'utf8');
  return tfvarsPath;
}

/**
 * Run Terraform command in isolated workspace
 */
async function runTerraformCommand(dir, cmd, env, deploymentId, workspace) {
  const logPath = path.join(LOGS_DIR, `${deploymentId}.log`);
  const logStream = fs.createWriteStream(logPath, { flags: 'a' });

  return new Promise((resolve, reject) => {
    const setupCmd = `terraform workspace select -or-create ${workspace}`;
    const fullCmd = `${setupCmd} && ${cmd}`;

    const terraform = exec(fullCmd, {
      cwd: dir,
      env,
      maxBuffer: 1024 * 1024 * 10,
      shell: '/bin/bash',
    });

    terraform.stdout.on('data', (data) => {
      logStream.write(data);
      console.log(`[Terraform][${deploymentId}] stdout:`, data.toString());
    });

    terraform.stderr.on('data', (data) => {
      logStream.write(data);
      console.error(`[Terraform][${deploymentId}] stderr:`, data.toString());
    });

    terraform.on('close', (code) => {
      logStream.end();
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Terraform failed with code ${code}`));
      }
    });

    terraform.on('error', (err) => {
      logStream.write(`Error: ${err.message}\n`);
      logStream.end();
      reject(err);
    });
  });
}

// 🔧 DEPLOY
export const deploy = async (req, res) => {
  const { moduleConfig, region, account: accountId, modules } = req.body;
  const deploymentId = `az-${uuidv4().slice(0, 8)}`;

  if (!accountId || !region || !modules || modules.length === 0) {
    return res.status(400).json({ success: false, error: 'Missing required fields: account, region, or modules' });
  }

  deployments.set(deploymentId, { status: 'deploying', startedAt: new Date() });

  try {
    const account = await getAzureAccountById(accountId);
    if (!account) {
      deployments.set(deploymentId, { status: 'failed', error: 'Azure account not found', completedAt: new Date() });
      return res.status(404).json({ success: false, error: 'Azure account not found' });
    }

    const requiredFields = ['subscriptionId', 'tenantId', 'clientId', 'clientSecret'];
    for (const field of requiredFields) {
      if (!account[field]) {
        const errorMsg = `Missing ${field}`;
        deployments.set(deploymentId, { status: 'failed', error: errorMsg, completedAt: new Date() });
        return res.status(400).json({ success: false, error: errorMsg });
      }
    }

    const env = {
      ...process.env,
      ARM_SUBSCRIPTION_ID: account.subscriptionId,
      ARM_TENANT_ID: account.tenantId,
      ARM_CLIENT_ID: account.clientId,
      ARM_CLIENT_SECRET: account.clientSecret,
    };

    await writeGlobalTfvars(moduleConfig, region, account.subscriptionId);
    await runTerraformCommand(TERRAFORM_DIR, 'terraform init', env, deploymentId, deploymentId);
    await runTerraformCommand(TERRAFORM_DIR, 'terraform apply -auto-approve', env, deploymentId, deploymentId);

    deployments.set(deploymentId, { status: 'success', completedAt: new Date() });
    res.status(200).json({ success: true, deploymentId });
  } catch (error) {
    console.error('Deploy error:', error);
    deployments.set(deploymentId, { status: 'failed', error: error.message, completedAt: new Date() });
    res.status(500).json({ success: false, error: error.message });
  }
};

// 🗑️ Destroy
async function _destroy(deploymentId, accountId, res) {
  if (!deploymentId || !accountId) {
    return res.status(400).json({ success: false, error: 'Missing deployment ID or account ID' });
  }

  try {
    const account = await getAzureAccountById(accountId);
    if (!account) {
      return res.status(404).json({ success: false, error: 'Azure account not found' });
    }

    const env = {
      ...process.env,
      ARM_SUBSCRIPTION_ID: account.subscriptionId,
      ARM_TENANT_ID: account.tenantId,
      ARM_CLIENT_ID: account.clientId,
      ARM_CLIENT_SECRET: account.clientSecret,
    };

    await runTerraformCommand(
      TERRAFORM_DIR,
      'terraform destroy -auto-approve',
      env,
      deploymentId,
      deploymentId
    );

    deployments.set(deploymentId, { status: 'destroyed', completedAt: new Date() });
    await fsPromises.unlink(path.join(LOGS_DIR, `${deploymentId}.log`)).catch(() => {});

    return res.status(200).json({ success: true, message: 'Resources destroyed successfully' });
  } catch (error) {
    console.error('Destroy error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export const destroy = (req, res) => _destroy(req.body.deploymentId, req.body.account, res);
export const destroyResource = (req, res) => _destroy(req.body.deploymentId, req.body.account, res);
export const destroyDeployment = (req, res) => _destroy(req.body.deploymentId, req.body.account, res);

// 📜 Get logs
export const getLogs = async (req, res) => {
  const { deploymentId } = req.params;
  const logPath = path.join(LOGS_DIR, `${deploymentId}.log`);
  try {
    const logs = await fsPromises.readFile(logPath, 'utf8');
    res.send(logs);
  } catch {
    res.status(404).send('Logs not found');
  }
};

// 📊 Get deployment status
export const getDeploymentStatus = (req, res) => {
  const { deploymentId } = req.params;
  const status = deployments.get(deploymentId);
  if (!status) {
    return res.status(404).json({ success: false, error: 'Deployment not found' });
  }
  res.json({
    success: true,
    deploymentId,
    status: status.status,
    startedAt: status.startedAt,
    completedAt: status.completedAt,
    error: status.error,
  });
};

// 📋 List all deployments
export const listDeployments = async (req, res) => {
  try {
    const accounts = await AzureCredential.find().lean();
    const defaultAccountId = accounts.length > 0 ? accounts[0]._id.toString() : null;

    const { stdout } = await new Promise((resolve, reject) => {
      exec(`cd ${TERRAFORM_DIR} && terraform workspace list`, (error, stdout, stderr) => {
        if (error) reject(error);
        else resolve({ stdout });
      });
    });

    const workspaces = stdout
      .split('\n')
      .map(line => line.trim().replace(/^\*/, '').trim())
      .filter(ws => ws.startsWith('az-'));

    const deploymentsList = workspaces.map(ws => {
      const status = deployments.get(ws) || { status: 'unknown', startedAt: null };
      return {
        id: ws,
        accountId: defaultAccountId,
        status: status.status,
        startedAt: status.startedAt,
        completedAt: status.completedAt,
        error: status.error,
      };
    });

    res.json({ success: true, deployments: deploymentsList });
  } catch (error) {
    console.error('List deployments error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// 📦 Stub
export const getResources = async (req, res) => {
  return res.status(501).json({ success: false, error: 'Not implemented' });
};
