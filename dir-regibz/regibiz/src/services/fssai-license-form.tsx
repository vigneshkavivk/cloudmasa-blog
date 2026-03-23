import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ArrowLeft } from 'lucide-react';

// --- Full State List ---
const stateOptions = [
  { value: 'AP', label: 'Andhra Pradesh' },
  { value: 'AR', label: 'Arunachal Pradesh' },
  { value: 'AS', label: 'Assam' },
  { value: 'BR', label: 'Bihar' },
  { value: 'CT', label: 'Chhattisgarh' },
  { value: 'GA', label: 'Goa' },
  { value: 'GJ', label: 'Gujarat' },
  { value: 'HR', label: 'Haryana' },
  { value: 'HP', label: 'Himachal Pradesh' },
  { value: 'JH', label: 'Jharkhand' },
  { value: 'KA', label: 'Karnataka' },
  { value: 'KL', label: 'Kerala' },
  { value: 'MP', label: 'Madhya Pradesh' },
  { value: 'MH', label: 'Maharashtra' },
  { value: 'MN', label: 'Manipur' },
  { value: 'ML', label: 'Meghalaya' },
  { value: 'MZ', label: 'Mizoram' },
  { value: 'NL', label: 'Nagaland' },
  { value: 'OR', label: 'Odisha' },
  { value: 'PB', label: 'Punjab' },
  { value: 'RJ', label: 'Rajasthan' },
  { value: 'SK', label: 'Sikkim' },
  { value: 'TN', label: 'Tamil Nadu' },
  { value: 'TG', label: 'Telangana' },
  { value: 'TR', label: 'Tripura' },
  { value: 'UP', label: 'Uttar Pradesh' },
  { value: 'UK', label: 'Uttarakhand' },
  { value: 'WB', label: 'West Bengal' },
  { value: 'AN', label: 'Andaman and Nicobar Islands' },
  { value: 'CH', label: 'Chandigarh' },
  { value: 'DN', label: 'Dadra and Nagar Haveli and Daman and Diu' },
  { value: 'DL', label: 'Delhi' },
  { value: 'JK', label: 'Jammu and Kashmir' },
  { value: 'LA', label: 'Ladakh' },
  { value: 'LD', label: 'Lakshadweep' },
  { value: 'PY', label: 'Puducherry' },
];

// --- City/District Data (All States & UTs) ---
const cityData: Record<string, string[]> = {
  // ... (keep all existing city data as-is)
  AP: ['Anantapur', 'Chittoor', 'East Godavari', 'Guntur', 'Krishna', 'Kurnool', 'Nellore', 'Prakasam', 'Srikakulam', 'Visakhapatnam', 'Vizianagaram', 'West Godavari', 'YSR Kadapa'],
  AR: ['Tawang', 'West Kameng', 'East Kameng', 'Papum Pare', 'Kurung Kumey', 'Kra Daadi', 'Lower Subansiri', 'Upper Subansiri', 'West Siang', 'East Siang', 'Siang', 'Upper Siang', 'Lower Siang', 'Lepa Rada', 'Shi Yomi', 'Pakke-Kessang', 'Longding', 'Tirap', 'Changlang', 'Namsai', 'Anjaw', 'Dibang Valley', 'Lohit', 'Lower Dibang Valley', 'Mahadevpur'],
  AS: ['Baksa', 'Barpeta', 'Biswanath', 'Bongaigaon', 'Cachar', 'Charaideo', 'Chirang', 'Darrang', 'Dhemaji', 'Dhubri', 'Dibrugarh', 'Goalpara', 'Golaghat', 'Hailakandi', 'Hojai', 'Jorhat', 'Kamrup Metropolitan', 'Kamrup Rural', 'Karbi Anglong', 'Karimganj', 'Kokrajhar', 'Lakhimpur', 'Majuli', 'Morigaon', 'Nagaon', 'Nalbari', 'Sivasagar', 'Sonitpur', 'South Salmara-Mankachar', 'Tinsukia', 'Udalguri', 'West Karbi Anglong'],
  BR: ['Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur', 'Buxar', 'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 'Kaimur', 'Katihar', 'Khagaria', 'Kishanganj', 'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur', 'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa', 'Samastipur', 'Saran', 'Sheikhpura', 'Sheohar', 'Sitamarhi', 'Siwan', 'Supaul', 'Vaishali', 'West Champaran'],
  CT: ['Balod', 'Baloda Bazar', 'Balrampur', 'Bastar', 'Bemetara', 'Bijapur', 'Bilaspur', 'Dantewada', 'Dhamtari', 'Durg', 'Gariaband', 'Gaurela-Pendra-Marwahi', 'Janjgir-Champa', 'Jashpur', 'Kabirdham', 'Kanker', 'Kondagaon', 'Korba', 'Korea', 'Mahasamund', 'Mungeli', 'Narayanpur', 'Raigarh', 'Raipur', 'Rajnandgaon', 'Sukma', 'Surajpur', 'Surguja'],
  GA: ['North Goa', 'South Goa'],
  GJ: ['Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 'Bhavnagar', 'Botad', 'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka', 'Gandhinagar', 'Gir Somnath', 'Jamnagar', 'Junagadh', 'Kheda', 'Kutch', 'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar', 'Tapi', 'Vadodara', 'Valsad'],
  HR: ['Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurugram', 'Hisar', 'Jhajjar', 'Jind', 'Kaithal', 'Karnal', 'Kurukshetra', 'Mahendragarh', 'Nuh', 'Palwal', 'Panchkula', 'Panipat', 'Rewari', 'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar'],
  HP: ['Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kinnaur', 'Kullu', 'Lahaul and Spiti', 'Mandi', 'Shimla', 'Sirmaur', 'Solan', 'Una'],
  JH: ['Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka', 'East Singhbhum', 'Garhwa', 'Giridih', 'Godda', 'Gumla', 'Hazaribagh', 'Jamtara', 'Khunti', 'Koderma', 'Latehar', 'Lohardaga', 'Pakur', 'Palamu', 'Ramgarh', 'Ranchi', 'Sahebganj', 'Seraikela Kharsawan', 'Simdega', 'West Singhbhum'],
  KA: ['Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar', 'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir'],
  KL: ['Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad'],
  MP: ['Agar Malwa', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat', 'Barwani', 'Betul', 'Bhind', 'Bhopal', 'Burhanpur', 'Chhatarpur', 'Chhindwara', 'Damoh', 'Datia', 'Dewas', 'Dhar', 'Dindori', 'Guna', 'Gwalior', 'Harda', 'Hoshangabad', 'Indore', 'Jabalpur', 'Jhabua', 'Katni', 'Khandwa', 'Khargone', 'Mandla', 'Mandsaur', 'Morena', 'Neemuch', 'Niwari', 'Panna', 'Raisen', 'Rajgarh', 'Ratlam', 'Rewa', 'Sagar', 'Satna', 'Sehore', 'Seoni', 'Shahdol', 'Shajapur', 'Sheopur', 'Shivpuri', 'Sidhi', 'Singrauli', 'Tikamgarh', 'Ujjain', 'Umaria', 'Vidisha'],
  MH: ['Ahmednagar', 'Akola', 'Amravati', 'Aurangabad', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik', 'Osmanabad', 'Palghar', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal'],
  MN: ['Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East', 'Imphal West', 'Jiribam', 'Kakching', 'Kamjong', 'Kangpokpi', 'Noney', 'Pherzawl', 'Senapati', 'Tamenglong', 'Tengnoupal', 'Thoubal', 'Ukhrul'],
  ML: ['East Garo Hills', 'East Jaintia Hills', 'East Khasi Hills', 'North Garo Hills', 'Ri-Bhoi', 'South Garo Hills', 'South West Garo Hills', 'South West Khasi Hills', 'West Garo Hills', 'West Jaintia Hills', 'West Khasi Hills'],
  MZ: ['Aizawl', 'Champhai', 'Hnahthial', 'Khawzawl', 'Kolasib', 'Lawngtlai', 'Lunglei', 'Mamit', 'Saiha', 'Serchhip', 'Saitual'],
  NL: ['Dimapur', 'Kiphire', 'Kohima', 'Longleng', 'Mokokchung', 'Mon', 'Peren', 'Phek', 'Tuensang', 'Wokha', 'Zunheboto'],
  OR: ['Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh', 'Cuttack', 'Deogarh', 'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur', 'Jajpur', 'Jharsuguda', 'Kalahandi', 'Kandhamal', 'Kendrapara', 'Kendujhar', 'Khordha', 'Koraput', 'Malkangiri', 'Mayurbhanj', 'Nabarangpur', 'Nayagarh', 'Nuapada', 'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh'],
  PB: ['Amritsar', 'Barnala', 'Bathinda', 'Fazilka', 'Ferozepur', 'Gurdaspur', 'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana', 'Malerkotla', 'Mansa', 'Moga', 'Pathankot', 'Patiala', 'Rupnagar', 'Sangrur', 'Shaheed Bhagat Singh Nagar', 'Sri Muktsar Sahib', 'Tarn Taran'],
  RJ: ['Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Bundi', 'Chittorgarh', 'Churu', 'Dausa', 'Dholpur', 'Dungarpur', 'Hanumangarh', 'Jaipur', 'Jaisalmer', 'Jalore', 'Jhalawar', 'Jhunjhunu', 'Jodhpur', 'Karauli', 'Kota', 'Nagaur', 'Pali', 'Pratapgarh', 'Rajsamand', 'Sawai Madhopur', 'Sikar', 'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur'],
  SK: ['East Sikkim', 'North Sikkim', 'South Sikkim', 'West Sikkim'],
  TN: ['Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar'],
  TG: ['Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagtial', 'Jangaon', 'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam', 'Kumuram Bheem', 'Mahabubabad', 'Mahbubnagar', 'Mancherial', 'Medak', 'Medchal–Malkajgiri', 'Mulugu', 'Nagarkurnool', 'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal Rural', 'Warangal Urban', 'Yadadri Bhuvanagiri'],
  TR: ['Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala', 'South Tripura', 'Unakoti', 'West Tripura'],
  UP: ['Agra', 'Aligarh', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya', 'Ayodhya', 'Azamgarh', 'Badaun', 'Baghpat', 'Bahraich', 'Balarampur', 'Ballia', 'Banda', 'Barabanki', 'Bareilly', 'Basti', 'Bhadohi', 'Bijnor', 'Budaun', 'Bulandshahr', 'Chandauli', 'Chitrakoot', 'Deoria', 'Etah', 'Etawah', 'Farrukhabad', 'Fatehpur', 'Firozabad', 'Gautam Buddha Nagar', 'Ghaziabad', 'Ghazipur', 'Gonda', 'Gorakhpur', 'Hamirpur', 'Hapur', 'Hardoi', 'Hathras', 'Jalaun', 'Jaunpur', 'Jhansi', 'Kannauj', 'Kanpur Dehat', 'Kanpur Nagar', 'Kasganj', 'Kaushambi', 'Kushinagar', 'Lakhimpur Kheri', 'Lalitpur', 'Lucknow', 'Maharajganj', 'Mahoba', 'Mainpuri', 'Mathura', 'Mau', 'Meerut', 'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Pratapgarh', 'Prayagraj', 'Rae Bareli', 'Rampur', 'Saharanpur', 'Sambhal', 'Sant Kabir Nagar', 'Shahjahanpur', 'Shamli', 'Shravasti', 'Siddharthnagar', 'Sitapur', 'Sonbhadra', 'Sultanpur', 'Unnao', 'Varanasi'],
  UK: ['Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun', 'Haridwar', 'Nainital', 'Pauri Garhwal', 'Pithoragarh', 'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar', 'Uttarkashi'],
  WB: ['Alipurduar', 'Bankura', 'Birbhum', 'Cooch Behar', 'Dakshin Dinajpur', 'Darjeeling', 'Hooghly', 'Howrah', 'Jalpaiguri', 'Jhargram', 'Kalimpong', 'Kolkata', 'Malda', 'Murshidabad', 'Nadia', 'North 24 Parganas', 'Paschim Bardhaman', 'Paschim Medinipur', 'Purba Bardhaman', 'Purba Medinipur', 'Purulia', 'South 24 Parganas', 'Uttar Dinajpur'],
  AN: ['Nicobar', 'North and Middle Andaman', 'South Andaman'],
  CH: ['Chandigarh'],
  DN: ['Dadra and Nagar Haveli', 'Daman', 'Diu'],
  DL: ['Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi', 'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi'],
  JK: ['Anantnag', 'Bandipora', 'Baramulla', 'Budgam', 'Doda', 'Ganderbal', 'Jammu', 'Kathua', 'Kishtwar', 'Kulgam', 'Kupwara', 'Poonch', 'Pulwama', 'Rajouri', 'Ramban', 'Reasi', 'Samba', 'Shopian', 'Srinagar', 'Udhampur'],
  LA: ['Kargil', 'Leh'],
  LD: ['Lakshadweep'],
  PY: ['Karaikal', 'Mahe', 'Puducherry', 'Yanam'],
  DEFAULT: ['District 1', 'District 2', 'District 3', 'District 4', 'District 5'],
};

// --- Business Category Options ---
const businessCategoryOptions = [
  { value: 'retailer', label: 'Retailer' },
  { value: 'manufacturer', label: 'Manufacturer' },
  { value: 'wholesaler', label: 'Wholesaler' },
  { value: 'transporter', label: 'Transporter' },
  { value: 'restaurant', label: 'Restaurant / Hotel' },
  { value: 'storage', label: 'Storage / Cold Storage' },
];

// --- Validators ---
const validators = {
  required: (value: string) => value.trim().length > 0 || "This field is required",
  email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Please enter a valid email address",
  mobile: (value: string) => /^[6-9]\d{9}$/.test(value) || "Enter a valid 10-digit mobile number",
  pan: (value: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(value) || "Invalid PAN format (e.g., ABCDE1234F)",
  zip: (value: string) => /^\d{6}$/.test(value) || "Pincode must be 6 digits",
  gstin: (value: string) =>
    value === "" ||
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(value) ||
    "Invalid GSTIN format",
};

// --- Helper: Determine License Type (FSSAI-compliant) ---
const getLicenseType = (
  turnoverStr: string,
  businessCategory: string,
  vehicleCount?: number
): 'basic' | 'state' | 'central' => {
  const cleanTurnover = turnoverStr.replace(/[^0-9.]/g, '');
  const turnover = parseFloat(cleanTurnover) || 0;

  // Transporters with >100 vehicles → Central
  if (businessCategory === 'transporter' && vehicleCount && vehicleCount > 100) {
    return 'central';
  }

  // Basic: ≤ ₹12 Lakh
  if (turnover <= 1200000) return 'basic';
  // State: > ₹12 Lakh and ≤ ₹20 Crore
  if (turnover <= 200000000) return 'state';
  // Central: > ₹20 Crore
  return 'central';
};

// --- Generate Dynamic Case ID ---
const generateCaseId = (registrationType: 'tatkal' | 'normal' | null) => {
  const prefix = registrationType === 'tatkal' ? 'FSSAI-TATKAL-' : 'FSSAI-';
  const year = new Date().getFullYear();
  const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}${year}-${randomSuffix}`;
};

// --- Status Banner ---
const StatusBanner: React.FC<{ registrationType: 'tatkal' | 'normal' | null }> = ({ registrationType }) => {
  const caseId = generateCaseId(registrationType);
  return (
    <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/10 border border-emerald-500/20 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-lg mb-8 relative overflow-hidden backdrop-blur-sm">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-10 pointer-events-none"></div>
      <div className="z-10 mb-2 sm:mb-0">
        {registrationType === 'tatkal' ? (
          <>
            <div className="flex items-baseline space-x-3">
              <span className="text-slate-500 font-medium line-through text-lg">₹1499</span>
              <span className="text-emerald-400 font-bold text-2xl tracking-tight drop-shadow-sm">₹1000</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Tatkal Fee
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1 font-medium">Govt fee extra — instant approval</p>
          </>
        ) : (
          <>
            <div className="flex items-baseline space-x-3">
              <span className="text-slate-500 font-medium line-through text-lg">₹499</span>
              <span className="text-emerald-400 font-bold text-2xl tracking-tight drop-shadow-sm">Free</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                Limited Offer
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1 font-medium">Govt fee only — zero professional charges</p>
          </>
        )}
      </div>
      <div className="text-left sm:text-right z-10">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Case Reference</p>
        <p className="text-slate-200 font-mono font-medium text-sm md:text-base">{caseId}</p>
      </div>
    </div>
  );
};

// --- Form Input ---
interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
}
const FormInput: React.FC<FormInputProps> = ({ label, error, hint, optional, className, id, required, ...props }) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="mb-5 group">
      <div className="flex justify-between items-baseline mb-1.5">
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-200 transition-colors group-focus-within:text-sky-400">
          {label} {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
        {optional && <span className="text-xs text-slate-500 font-medium">Optional</span>}
      </div>
      <div className="relative">
        <input
          id={inputId}
          className={`w-full bg-slate-800/50 border text-white text-sm rounded-lg block p-3 placeholder-slate-500 shadow-sm transition-all duration-200 ease-in-out backdrop-blur-sm focus:ring-2 focus:outline-none ${
            error ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500/20 hover:border-slate-600'
          } ${className}`}
          aria-invalid={!!error}
          required={required}
          {...props}
        />
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-red-400 flex items-center animate-pulse">
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500 font-mono">{hint}</p>
      ) : null}
    </div>
  );
};

// --- Form Select ---
interface Option { value: string; label: string; }
interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  error?: string;
  optional?: boolean;
}
const FormSelect: React.FC<FormSelectProps> = ({ label, options, error, optional, id, required, value, ...props }) => {
  const selectId = id || label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="mb-5 group">
      <div className="flex justify-between items-baseline mb-1.5">
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-200 transition-colors group-focus-within:text-sky-400">
          {label} {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
        {optional && <span className="text-xs text-slate-500 font-medium">Optional</span>}
      </div>
      <div className="relative">
        <select
          id={selectId}
          className={`w-full bg-slate-800/50 border text-white text-sm rounded-lg block p-3 pr-10 appearance-none placeholder-slate-400 shadow-sm transition-all duration-200 ease-in-out backdrop-blur-sm focus:ring-2 focus:outline-none cursor-pointer ${
            error ? 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-700 focus:border-sky-500 focus:ring-sky-500/20 hover:border-slate-600'
          } ${!value ? 'text-slate-500' : 'text-white'}`}
          required={required}
          value={value}
          {...props}
        >
          <option value="" disabled>{!value ? "Select an option" : ""}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="text-slate-900 bg-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-400 flex items-center animate-pulse">
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </p>
      )}
    </div>
  );
};

// --- File Uploader with Size Validation ---
const FileUploader: React.FC<{
  label: string;
  name: string;
  accept?: string;
  onChange: (file: File | null) => void;
  required?: boolean;
  disabled?: boolean;
}> = ({ label, name, accept = ".pdf,.jpg,.jpeg,.png", onChange, required, disabled = false }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    processFile(file);
  };

  const processFile = (file: File | null) => {
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("File size must be under 2MB");
        return;
      }
      setFileName(file.name);
      onChange(file);
    } else {
      setFileName(null);
      onChange(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    processFile(file);
  };

  return (
    <div className={`mb-5 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-baseline mb-1.5">
        <label className="block text-sm font-medium text-slate-200">
          {label} {required && <span className="text-red-500">*</span>}
          {disabled && <span className="text-xs text-slate-500 ml-2">(Not Required)</span>}
        </label>
      </div>
      <div
        className={`relative border-2 border-dashed rounded-xl p-4 transition-all duration-200 ease-in-out cursor-pointer group ${
          isDragging ? 'border-sky-500 bg-sky-500/10' : fileName ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 bg-slate-800/30 hover:border-slate-500 hover:bg-slate-800/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          name={name}
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
        <div className="flex items-center space-x-4">
          <div className={`p-2.5 rounded-lg shrink-0 transition-colors ${fileName ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-400 group-hover:text-sky-400'}`}>
            {fileName ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            {fileName ? (
              <div>
                <p className="text-sm font-medium text-emerald-400 truncate">{fileName}</p>
                <p className="text-xs text-slate-400 mt-0.5">File ready for upload</p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-slate-300 font-medium group-hover:text-white transition-colors">
                  {disabled ? 'Skipped (not applicable)' : 'Click to upload or drag & drop'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">PDF, JPEG, PNG (Max 2MB)</p>
              </div>
            )}
          </div>
          {fileName && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setFileName(null);
                onChange(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Info Sidebar ---
const InfoSidebar: React.FC<{
  formData: any;
  uploadedFiles: Record<string, boolean>;
  currentStep: number;
  onPreview: () => void;
  registrationType: 'tatkal' | 'normal' | null;
}> = ({ formData, uploadedFiles, currentStep, onPreview, registrationType }) => {
  const getStepStatus = (step: number) => {
    if (step < currentStep - 1) return 'completed';
    if (step === currentStep - 1) return 'active';
    return 'pending';
  };

  const licenseType = getLicenseType(formData.turnover, formData.businessCategory);
  const isCompany = ['pvtltd', 'llp'].includes(formData.constitution);
  const isNormal = registrationType === 'normal';

  const getFoodDocumentLabel = () => {
    switch (formData.businessCategory) {
      case 'manufacturer':
        return 'Food Safety Management Plan';
      case 'transporter':
        return 'Vehicle List with Registration Numbers';
      case 'storage':
        return 'Storage Capacity Certificate';
      default:
        return 'List of Food Products';
    }
  };

  const docList = [
    { key: 'identityProof', label: 'Identity Proof (Aadhaar/PAN)', required: true },
    { key: 'addressProof', label: 'Address Proof of Premises', required: true },
    { key: 'photo', label: 'Passport Photo', required: true },
    { key: 'foodPlan', label: getFoodDocumentLabel(), required: true },
    {
      key: 'incorporation',
      label: 'Certificate of Incorporation',
      required: (licenseType === 'state' || licenseType === 'central') && isCompany,
    },
    {
      key: 'noc',
      label: 'NOC from Municipality/Health Dept',
      required: licenseType === 'state' || licenseType === 'central',
    },
    { key: 'premiseProof', label: 'Proof of Possession of Premises', required: true },
  ];

  return (
    <div className="space-y-6 hidden lg:block">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 shadow-xl transition-all duration-300">
        <h3 className="text-white text-sm font-semibold mb-4 flex items-center">
          <span className="bg-sky-500/20 p-1 rounded mr-2">
            <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </span>
          Progress Status
        </h3>
        <div className="relative border-l-2 border-slate-700/60 ml-2 space-y-6 my-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="ml-5 relative">
              <span
                className={`absolute -left-[27px] w-3 h-3 rounded-full border-2 border-slate-800 transition-all duration-300 ${
                  getStepStatus(step) === 'completed'
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : getStepStatus(step) === 'active'
                    ? 'bg-sky-500 ring-4 ring-sky-500/20 shadow-[0_0_8px_rgba(56,189,248,0.5)] scale-110'
                    : 'bg-slate-700'
                }`}
              ></span>
              <h4
                className={`text-xs font-medium transition-colors ${
                  getStepStatus(step) === 'active'
                    ? 'text-white'
                    : getStepStatus(step) === 'completed'
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                {step === 1 ? 'Business Profile' : step === 2 ? 'Contact & Address' : 'Docs & Verification'}
              </h4>
              <p className="text-slate-400 text-[10px] mt-0.5">
                {step === 3
                  ? `${Object.values(uploadedFiles).filter(Boolean).length}/${docList.filter(d => d.required).length} Uploaded`
                  : getStepStatus(step) === 'completed'
                  ? 'Completed'
                  : getStepStatus(step) === 'active'
                  ? 'In Progress'
                  : 'Pending'}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div
        className={`bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 shadow-xl transition-opacity duration-300 ${
          currentStep === 4 ? 'opacity-100 ring-1 ring-emerald-500/30' : 'opacity-70'
        }`}
      >
        <h3 className="text-white text-sm font-semibold mb-3 flex items-center">
          <span className="bg-amber-500/20 p-1 rounded mr-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </span>
          Required Documents
        </h3>
        <ul className="space-y-2.5">
          {docList.map((item, idx) => {
            const isUploaded = uploadedFiles[item.key];
            const showItem = item.required || (isUploaded && !item.required);
            if (!showItem) return null;
            return (
              <li key={idx} className="flex items-center text-xs text-slate-300 justify-between group">
                <div className="flex items-center">
                  <div className={`mr-2.5 transition-all duration-500 ${isUploaded ? 'text-emerald-400 scale-110' : item.required ? 'text-slate-600' : 'text-slate-500/50'}`}>
                    {isUploaded ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                  </div>
                  <span className={isUploaded ? 'text-emerald-100' : item.required ? 'text-slate-300' : 'text-slate-500'}>
                    {item.label}
                    {!item.required && <span className="text-slate-500 ml-1">(Optional)</span>}
                  </span>
                </div>
                {isUploaded && <span className="text-[10px] text-emerald-500/80 font-mono">READY</span>}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-5 shadow-xl">
        <h3 className="text-white text-sm font-semibold mb-3 flex items-center">
          <span className="bg-rose-500/20 p-1 rounded mr-2">
            <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </span>
          Help Desk
        </h3>
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-800/40 p-2 rounded-lg border border-slate-700/30">
            <span>FSSAI Helpline</span>
            <span className="font-mono text-emerald-400 font-medium">9858748657</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-800/40 p-2 rounded-lg border border-slate-700/30">
            <span>Email</span>
            <span className="text-sky-400 font-medium">info@regibiz@gmail.com</span>
          </div>
        </div>
      </div>
      <div className="pt-2 flex justify-center">
        <button
          onClick={onPreview}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-slate-800 to-slate-800/80 border border-slate-600/50 text-sky-400 font-bold tracking-wide shadow-lg hover:bg-slate-700 hover:text-white hover:border-sky-500/50 hover:shadow-sky-500/10 transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          Preview Application
        </button>
      </div>
    </div>
  );
};

// --- Main Form ---
interface FormData {
  businessName: string;
  pan: string;
  constitution: string;
  turnover: string;
  premiseType: string;
  businessCategory: string; // ← NEW FIELD
  email: string;
  mobile: string;
  altMobile: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
  gstin: string;
}

const initialData: FormData = {
  businessName: '',
  pan: '',
  constitution: '',
  turnover: '',
  premiseType: '',
  businessCategory: '', // ← INITIALIZED
  email: '',
  mobile: '',
  altMobile: '',
  address1: '',
  city: '',
  state: '',
  zip: '',
  gstin: '',
};

const constitutionOptions = [
  { value: 'proprietorship', label: 'Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'pvtltd', label: 'Private Limited Company' },
  { value: 'llp', label: 'Limited Liability Partnership' },
  { value: 'huf', label: 'Hindu Undivided Family' },
];

const premiseOptions = [
  { value: 'home', label: 'Home Kitchen / Retail Shop' },
  { value: 'commercial', label: 'Commercial Premise' },
  { value: 'manufacturing', label: 'Manufacturing Unit' },
  { value: 'cloud', label: 'Cloud Kitchen' },
];

export default function FssaiLicenseForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [registrationType, setRegistrationType] = useState<'tatkal' | 'normal' | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState({
    identityProof: false,
    addressProof: false,
    photo: false,
    foodPlan: false,
    incorporation: false,
    noc: false,
    premiseProof: false,
  });
  const [captcha, setCaptcha] = useState({ val1: 0, val2: 0, userAnswer: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const generateCaptcha = useCallback(() => {
    setCaptcha({ val1: Math.floor(Math.random() * 10) + 1, val2: Math.floor(Math.random() * 10) + 1, userAnswer: '' });
  }, []);

  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  const handleFileUpload = (key: keyof typeof uploadedFiles) => (file: File | null) => {
    setUploadedFiles((prev) => ({ ...prev, [key]: !!file }));
  };

  const validateField = (name: keyof FormData, value: string): string => {
    switch (name) {
      case 'businessName':
      case 'address1':
      case 'city':
      case 'state':
      case 'constitution':
      case 'premiseType':
      case 'businessCategory':
      case 'turnover':
        return validators.required(value) === true ? '' : (validators.required(value) as string);
      case 'pan':
        return validators.pan(value) === true ? '' : (validators.pan(value) as string);
      case 'email':
        return validators.email(value) === true ? '' : (validators.email(value) as string);
      case 'mobile':
        return validators.mobile(value) === true ? '' : (validators.mobile(value) as string);
      case 'gstin':
        return validators.gstin(value) === true ? '' : (validators.gstin(value) as string);
      case 'zip':
        return validators.zip(value) === true ? '' : (validators.zip(value) as string);
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const key = name as keyof FormData;
    let formattedValue = value;

    if (key === 'pan') formattedValue = value.toUpperCase().slice(0, 10);
    if (['mobile', 'altMobile'].includes(key)) formattedValue = value.replace(/\D/g, '').slice(0, 10);
    if (key === 'gstin') formattedValue = value.toUpperCase().slice(0, 15);
    if (key === 'zip') formattedValue = value.replace(/\D/g, '').slice(0, 6);

    // Fix: Avoid double setFormData on state change
    if (key === 'state') {
      setFormData((prev) => ({ ...prev, state: formattedValue, city: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [key]: formattedValue }));
    }

    if (touched[key]) {
      setErrors((prev) => ({ ...prev, [key]: validateField(key, formattedValue) }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const key = name as keyof FormData;
    setTouched((prev) => ({ ...prev, [key]: true }));
    setErrors((prev) => ({ ...prev, [key]: validateField(key, value) }));
  };

  const getStepFields = (step: number): (keyof FormData)[] => {
    switch (step) {
      case 1:
        return ['businessName', 'pan', 'constitution', 'turnover', 'premiseType', 'businessCategory'];
      case 2:
        return ['email', 'mobile', 'address1', 'city', 'zip', 'state', 'gstin'];
      default:
        return [];
    }
  };

  const validateCurrentStep = (): boolean => {
    if (currentStep === 0) return true;
    const fields = getStepFields(currentStep);
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    let isValid = true;
    fields.forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });
    if (!isValid) {
      setErrors((prev) => ({ ...prev, ...newErrors }));
      setTouched((prev) => {
        const touchedFields = { ...prev };
        fields.forEach((f) => (touchedFields[f] = true));
        return touchedFields;
      });
    }
    return isValid;
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!registrationType) return;
      setCurrentStep(1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!validateCurrentStep()) return;

    if (currentStep === 1) {
      const licenseType = getLicenseType(formData.turnover, formData.businessCategory);
      const isTatkalEligible = licenseType === 'basic' && formData.premiseType !== 'manufacturing';

      if (registrationType === 'tatkal' && !isTatkalEligible) {
        // Do NOT alert — handled inline in UI
        return;
      }
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep((prev) => prev + 1);
  };

  const handlePrevious = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (currentStep === 1) {
      setCurrentStep(0);
    } else {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleGoBack = () => {
    navigate("/servicepanel/fssai-license");
  };

  const licenseType = getLicenseType(formData.turnover, formData.businessCategory);
  const isCompany = ['pvtltd', 'llp'].includes(formData.constitution);
  const isNormal = registrationType === 'normal';
  const isTatkalEligible = licenseType === 'basic' && formData.premiseType !== 'manufacturing';

  const isDocRequired = {
    identityProof: true,
    addressProof: true,
    photo: true,
    foodPlan: true,
    incorporation: (licenseType === 'state' || licenseType === 'central') && isCompany,
    noc: licenseType === 'state' || licenseType === 'central',
    premiseProof: true,
  };

  const getCitiesForState = (stateCode: string): Option[] => {
    const cities = cityData[stateCode] || cityData.DEFAULT;
    return cities.map(city => ({ value: city, label: city }));
  };

  const getFoodDocumentLabel = () => {
    switch (formData.businessCategory) {
      case 'manufacturer':
        return 'Food Safety Management Plan';
      case 'transporter':
        return 'Vehicle List with Registration Numbers';
      case 'storage':
        return 'Storage Capacity Certificate';
      default:
        return 'List of Food Products';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (registrationType === 'tatkal' && !isTatkalEligible) {
      alert("Tatkal is only for Basic non-manufacturing units.");
      return;
    }

    let missing = false;
    Object.entries(isDocRequired).forEach(([key, required]) => {
      if (required && !uploadedFiles[key as keyof typeof uploadedFiles]) {
        missing = true;
      }
    });
    if (missing) {
      alert('Please upload all required documents.');
      return;
    }

    if (parseInt(captcha.userAnswer) !== captcha.val1 + captcha.val2) {
      alert('Incorrect Security Math Answer');
      return;
    }

    if (validateCurrentStep()) {
      setIsSubmitting(true);
      setTimeout(() => {
        setIsSubmitting(false);
        setIsSuccess(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 1500);
    }
  };

  // --- Preview Modal ---
  const PreviewModal = () => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">FSSAI Application Preview</h3>
          <button
            onClick={() => setShowPreview(false)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h4 className="font-semibold text-emerald-400 mb-2">Registration Type</h4>
            <p className="text-white">{registrationType === 'tatkal' ? 'Tatkal (Instant)' : 'Normal (Standard)'}</p>
          </div>
          <div>
            <h4 className="font-semibold text-emerald-400 mb-2">License Type</h4>
            <p className="text-white capitalize">{licenseType} License</p>
          </div>
          <div>
            <h4 className="font-semibold text-emerald-400 mb-2">Business Profile</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Business Name:</span> <span className="text-white">{formData.businessName || '—'}</span></div>
              <div><span className="text-slate-500">PAN:</span> <span className="text-white">{formData.pan || '—'}</span></div>
              <div><span className="text-slate-500">Constitution:</span> <span className="text-white">
                {constitutionOptions.find(o => o.value === formData.constitution)?.label || '—'}
              </span></div>
              <div><span className="text-slate-500">Annual Turnover:</span> <span className="text-white">{formData.turnover || '—'}</span></div>
              <div><span className="text-slate-500">Premise Type:</span> <span className="text-white">
                {premiseOptions.find(p => p.value === formData.premiseType)?.label || '—'}
              </span></div>
              <div><span className="text-slate-500">Business Category:</span> <span className="text-white">
                {businessCategoryOptions.find(b => b.value === formData.businessCategory)?.label || '—'}
              </span></div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-emerald-400 mb-2">Contact & Address</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="text-slate-500">Email:</span> <span className="text-white">{formData.email || '—'}</span></div>
              <div><span className="text-slate-500">Mobile:</span> <span className="text-white">{formData.mobile || '—'}</span></div>
              <div><span className="text-slate-500">Address:</span> <span className="text-white">{formData.address1 || '—'}</span></div>
              <div><span className="text-slate-500">City / State / PIN:</span> <span className="text-white">
                {formData.city} / {stateOptions.find(s => s.value === formData.state)?.label || '—'} / {formData.zip || '—'}
              </span></div>
              <div><span className="text-slate-500">GSTIN:</span> <span className="text-white">{formData.gstin || 'Not Applicable'}</span></div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-emerald-400 mb-2">Documents Uploaded</h4>
            <ul className="space-y-2">
              {[
                { key: 'identityProof', label: 'Identity Proof (Aadhaar/PAN)' },
                { key: 'addressProof', label: 'Address Proof of Premises' },
                { key: 'photo', label: 'Passport Photo' },
                { key: 'foodPlan', label: getFoodDocumentLabel() },
                ...(isDocRequired.incorporation ? [{ key: 'incorporation', label: 'Certificate of Incorporation' }] : []),
                ...(isDocRequired.noc ? [{ key: 'noc', label: 'NOC from Municipality' }] : []),
                { key: 'premiseProof', label: 'Proof of Possession of Premises' },
              ].map((doc) => (
                <li key={doc.key} className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg">
                  <span className="text-slate-300">{doc.label}</span>
                  {uploadedFiles[doc.key as keyof typeof uploadedFiles] ? (
                    <span className="text-emerald-400 font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Ready
                    </span>
                  ) : (
                    <span className="text-slate-500">Pending</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="p-6 bg-slate-800/50 flex justify-end gap-3">
          <button
            onClick={() => setShowPreview(false)}
            className="px-4 py-2 text-slate-300 hover:text-white rounded-lg border border-slate-600 hover:bg-slate-700"
          >
            Close
          </button>
          <button
            onClick={() => {
              setShowPreview(false);
              document.getElementById('submit-btn')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium"
          >
            Continue to Submit
          </button>
        </div>
      </div>
    </div>
  );

  if (isSuccess) {
    const caseId = generateCaseId(registrationType);
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-md w-full text-center border border-slate-700/50">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">FSSAI Registration Submitted!</h2>
          <p className="text-slate-300 mb-8">
            Your application has been received successfully. Your case ID is{' '}
            <span className="text-sky-400 font-mono">{caseId}</span>.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/servicepanel/fssai-license")}
              className="w-full bg-slate-700/50 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 border border-slate-600"
            >
              Back to Service Details
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 border border-emerald-500/30"
            >
              Start New Registration
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Format turnover for display
  const formattedTurnover = formData.turnover
    ? Number(formData.turnover.replace(/[^0-9]/g, '')).toLocaleString('en-IN')
    : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020c1b] to-[#0a192f] p-4 sm:p-6 md:p-8">
      <div className="max-w-[1600px] mx-auto">
        <div className="lg:hidden mb-6 text-center">
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">FSSAI License</h1>
          <p className="text-sky-200/80 text-sm">
            {currentStep === 0 ? 'Choose Registration Type' : `Step ${currentStep} of 3`}
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <main className="lg:col-span-7 xl:col-span-8 glass-panel rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] overflow-hidden relative min-h-[600px] flex flex-col">
            <div className="p-6 md:p-10 flex-grow">
              <div className="text-center mb-8 hidden lg:block">
                <h1 className="text-3xl font-bold text-white mb-3 tracking-tight drop-shadow-md">FSSAI Registration</h1>
                <p className="text-slate-300 text-base max-w-lg mx-auto leading-relaxed">
                  {currentStep === 0 && 'Choose between instant (Tatkal) or standard (Normal) registration.'}
                  {currentStep === 1 && 'Tell us about your food business.'}
                  {currentStep === 2 && 'Provide contact and registered address details.'}
                  {currentStep === 3 && 'Upload supporting documents for verification.'}
                </p>
              </div>

              {currentStep >= 1 && <StatusBanner registrationType={registrationType} />}

              {/* --- License Type Badge with Explanation --- */}
              {currentStep >= 1 && (
                <div className="mb-6 p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300">Recommended License Type:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      licenseType === 'basic'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : licenseType === 'state'
                        ? 'bg-sky-500/20 text-sky-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {licenseType.toUpperCase()} LICENSE
                    </span>
                  </div>
                  {formattedTurnover && (
                    <p className="text-xs text-slate-400 mt-1">
                      Based on your turnover of ₹{formattedTurnover}
                    </p>
                  )}
                </div>
              )}

              {/* --- Inline Tatkal Warning --- */}
              {currentStep === 1 && registrationType === 'tatkal' && !isTatkalEligible && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                  Tatkal is only available for Basic Registration (≤ ₹12 Lakh) and non-manufacturing premises.
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                <div className="grid grid-cols-1 gap-y-10">
                  {/* STEP 0: Registration Type */}
                  {currentStep === 0 && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-bold text-white text-center">Choose Registration Type</h2>
                      <p className="text-slate-400 text-center max-w-lg mx-auto">
                        Select based on your business scale and urgency.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card
                          className={`cursor-pointer transition-all duration-300 transform hover:scale-[1.02] rounded-2xl overflow-hidden shadow-xl ${
                            registrationType === 'tatkal' ? 'ring-2 ring-orange-400' : ''
                          }`}
                          onClick={() => {
                            setRegistrationType('tatkal');
                            setTimeout(() => {
                              setCurrentStep(1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 150);
                          }}
                        >
                          <div className="bg-gradient-to-br from-[#fe9b01] to-[#f97316] p-6 text-white" style={{ minHeight: '220px' }}>
                            <div className="flex items-start justify-between mb-4">
                              <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">TATKAL</span>
                              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <h3 className="font-bold text-lg mb-2">Instant Approval</h3>
                            <ul className="text-white/90 text-sm space-y-1.5">
                              <li>✅ 1–2 hours (for eligible businesses)</li>
                              <li>✅ Digital verification only</li>
                              <li>✅ For small-scale, non-manufacturing units</li>
                              <li>❌ Not for manufacturing / high-risk units</li>
                            </ul>
                            <div className="mt-4 pt-4 border-t border-white/20">
                              <p className="text-xs font-mono">Fee: ₹1000 + Govt. fee</p>
                            </div>
                          </div>
                        </Card>
                        <Card
                          className={`cursor-pointer transition-all duration-300 transform hover:scale-[1.02] rounded-2xl overflow-hidden shadow-xl ${
                            registrationType === 'normal' ? 'ring-2 ring-cyan-400' : ''
                          }`}
                          onClick={() => {
                            setRegistrationType('normal');
                            setTimeout(() => {
                              setCurrentStep(1);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }, 150);
                          }}
                        >
                          <div className="bg-gradient-to-br from-[#3ddafe] to-[#0ea5e9] p-6 text-white" style={{ minHeight: '220px' }}>
                            <div className="flex items-start justify-between mb-4">
                              <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">NORMAL</span>
                              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <h3 className="font-bold text-lg mb-2">Standard Process</h3>
                            <ul className="text-white/90 text-sm space-y-1.5">
                              <li>✅ 30–60 days approval</li>
                              <li>✅ Physical inspection (if required)</li>
                              <li>✅ For all business types (incl. manufacturing)</li>
                              <li>✅ Lower professional fee</li>
                            </ul>
                            <div className="mt-4 pt-4 border-t border-white/20">
                              <p className="text-xs font-mono">Fee: ₹499 + Govt. fee</p>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* STEP 1: Business Profile */}
                  {currentStep === 1 && (
                    <fieldset className="space-y-4">
                      <legend className="text-lg font-semibold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-6 w-full flex items-center">
                        <span className="bg-sky-500 w-1 h-5 mr-3 rounded-full inline-block shadow-[0_0_10px_rgba(56,189,248,0.5)]"></span>
                        Business Details
                      </legend>
                      <FormInput
                        label="Business Name"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.businessName}
                        placeholder="e.g., Spicy Bites Kitchen"
                        required
                        autoFocus
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormInput
                          label="PAN"
                          name="pan"
                          value={formData.pan}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.pan}
                          placeholder="ABCDE1234F"
                          hint="Format: ABCDE1234F"
                          maxLength={10}
                          required
                        />
                        <FormSelect
                          label="Constitution"
                          name="constitution"
                          value={formData.constitution}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.constitution}
                          options={constitutionOptions}
                          required
                        />
                      </div>
                      <FormInput
                        type="number"
                        label="Estimated Annual Turnover (₹)"
                        name="turnover"
                        value={formData.turnover}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.turnover}
                        placeholder="e.g., 800000"
                        required
                      />
                      <FormSelect
                        label="Type of Premise"
                        name="premiseType"
                        value={formData.premiseType}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.premiseType}
                        options={premiseOptions}
                        required
                      />
                      <FormSelect
                        label="Business Category"
                        name="businessCategory"
                        value={formData.businessCategory}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.businessCategory}
                        options={businessCategoryOptions}
                        required
                      />
                    </fieldset>
                  )}

                  {/* STEP 2: Contact & Address */}
                  {currentStep === 2 && (
                    <fieldset className="space-y-4">
                      <legend className="text-lg font-semibold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-6 w-full flex items-center">
                        <span className="bg-emerald-500 w-1 h-5 mr-3 rounded-full inline-block shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                        Contact & Address
                      </legend>
                      <FormInput
                        type="email"
                        label="Email Address"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.email}
                        placeholder="you@business.com"
                        required
                        autoFocus
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormInput
                          type="tel"
                          label="Mobile Number"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.mobile}
                          placeholder="9876543210"
                          maxLength={10}
                          required
                        />
                        <FormInput
                          type="tel"
                          label="Alternate Mobile"
                          name="altMobile"
                          value={formData.altMobile}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Optional"
                          maxLength={10}
                          optional
                        />
                      </div>
                      <FormInput
                        label="Premises Address"
                        name="address1"
                        value={formData.address1}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.address1}
                        placeholder="Shop No. 5, MG Road"
                        required
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormSelect
                          label="State"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.state}
                          options={stateOptions}
                          required
                        />
                        <FormSelect
                          label="City / District"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={errors.city}
                          options={getCitiesForState(formData.state)}
                          required
                          disabled={!formData.state}
                        />
                      </div>
                      <FormInput
                        label="Pincode"
                        name="zip"
                        value={formData.zip}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.zip}
                        placeholder="6-digit PIN"
                        maxLength={6}
                        required
                      />
                      <FormInput
                        label="GSTIN (if applicable)"
                        name="gstin"
                        value={formData.gstin}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.gstin}
                        placeholder="22AAAAA0000A1Z5"
                        hint="Leave blank if not registered"
                        optional
                        maxLength={15}
                      />
                    </fieldset>
                  )}

                  {/* STEP 3: Document Uploads */}
                  {currentStep === 3 && (
                    <div>
                      <fieldset className="space-y-4 mb-8">
                        <legend className="text-lg font-semibold text-white uppercase tracking-wider border-b border-slate-700/50 pb-2 mb-6 w-full flex items-center">
                          <span className="bg-amber-500 w-1 h-5 mr-3 rounded-full inline-block shadow-[0_0_10px_rgba(245,158,11,0.5)]"></span>
                          Document Uploads
                        </legend>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <FileUploader
                            label="Identity Proof (Aadhaar/PAN)"
                            name="identityProof"
                            required={isDocRequired.identityProof}
                            onChange={handleFileUpload('identityProof')}
                          />
                          <FileUploader
                            label="Address Proof of Premises"
                            name="addressProof"
                            required={isDocRequired.addressProof}
                            onChange={handleFileUpload('addressProof')}
                          />
                          <FileUploader
                            label="Passport Size Photo"
                            name="photo"
                            required={isDocRequired.photo}
                            onChange={handleFileUpload('photo')}
                          />
                          <FileUploader
                            label={getFoodDocumentLabel()}
                            name="foodPlan"
                            required={isDocRequired.foodPlan}
                            onChange={handleFileUpload('foodPlan')}
                          />
                          <FileUploader
                            label="Certificate of Incorporation"
                            name="incorporation"
                            required={isDocRequired.incorporation}
                            disabled={!isDocRequired.incorporation}
                            onChange={handleFileUpload('incorporation')}
                          />
                          <FileUploader
                            label="NOC from Municipality/Health Dept"
                            name="noc"
                            required={isDocRequired.noc}
                            disabled={!isDocRequired.noc}
                            onChange={handleFileUpload('noc')}
                          />
                          <FileUploader
                            label="Proof of Possession of Premises"
                            name="premiseProof"
                            required={isDocRequired.premiseProof}
                            onChange={handleFileUpload('premiseProof')}
                          />
                        </div>
                      </fieldset>
                      <div className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/50 flex flex-col sm:flex-row items-center justify-between">
                        <div className="mb-4 sm:mb-0">
                          <h4 className="text-sm font-semibold text-white flex items-center">
                            <svg className="w-4 h-4 mr-2 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Security Verification
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">Please solve the math problem to prove you are human.</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="bg-slate-900 px-4 py-2 rounded-lg border border-slate-700 font-mono text-lg font-bold text-sky-400 tracking-wider">
                            {captcha.val1} + {captcha.val2} = ?
                          </div>
                          <input
                            type="number"
                            className="w-20 bg-slate-800 border border-slate-600 rounded-lg p-2 text-center text-white focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none transition-all"
                            placeholder="?"
                            value={captcha.userAnswer}
                            onChange={(e) => setCaptcha({ ...captcha, userAnswer: e.target.value })}
                          />
                          <button
                            type="button"
                            onClick={generateCaptcha}
                            className="p-2 text-slate-500 hover:text-white transition-colors"
                            title="Refresh Captcha"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-12 pt-6 border-t border-slate-700/50">
                  <div className="flex flex-col-reverse md:flex-row items-center gap-4 justify-between">
                    <div className="w-full md:w-auto flex gap-4">
                      {currentStep > 0 && (
                        <button
                          type="button"
                          onClick={handlePrevious}
                          className="w-full md:w-auto px-6 py-4 rounded-xl font-semibold text-slate-300 border border-slate-600 hover:bg-slate-800 hover:text-white transition-all duration-200"
                        >
                          Back
                        </button>
                      )}
                    </div>

                    {currentStep > 0 && currentStep < 3 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={registrationType === 'tatkal' && !isTatkalEligible}
                        className={`w-full md:w-auto px-10 py-4 rounded-xl font-bold text-lg tracking-wide shadow-lg transition-all duration-300 flex items-center justify-center ${
                          (currentStep === 1 && registrationType === 'tatkal' && !isTatkalEligible)
                            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed opacity-70'
                            : 'bg-sky-500 text-white hover:bg-sky-400 hover:-translate-y-1'
                        }`}
                      >
                        Next Step
                        <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    ) : currentStep === 3 ? (
                      <button
                        id="submit-btn"
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold text-lg tracking-wide shadow-lg transition-all duration-300 transform border border-transparent ${
                          isSubmitting
                            ? 'bg-slate-800/50 text-slate-500 cursor-not-allowed opacity-70 border-slate-700'
                            : 'bg-emerald-500/90 text-white hover:bg-emerald-500 hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] active:translate-y-0 backdrop-blur-sm'
                        }`}
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </span>
                        ) : (
                          'Submit Application'
                        )}
                      </button>
                    ) : null}
                  </div>
                  <p className="mt-4 text-center text-xs text-slate-400">
                    {currentStep === 0 ? 'Click a card above to continue.' : `Step ${currentStep} of 3`} — By continuing, you agree to our{' '}
                    <a href="#" className="text-sky-400 hover:text-sky-300 hover:underline transition-colors">
                      Terms
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-sky-400 hover:text-sky-300 hover:underline transition-colors">
                      Policy
                    </a>
                    .
                  </p>
                </div>
              </form>
            </div>
          </main>
          <aside className="lg:col-span-5 xl:col-span-4 sticky top-8">
            <InfoSidebar
              formData={formData}
              uploadedFiles={uploadedFiles}
              currentStep={currentStep}
              onPreview={() => setShowPreview(true)}
              registrationType={registrationType}
            />
          </aside>
        </div>
        <div className="mt-12 text-center text-slate-500 text-sm pb-8">&copy; 2026 RegiPRO. All rights reserved.</div>
      </div>
      {showPreview && <PreviewModal />}
    </div>
  );
}