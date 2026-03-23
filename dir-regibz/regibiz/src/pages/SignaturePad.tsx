// \src\pages\SignaturePad.tsx
    import { useRef, useEffect, useState } from "react";
    import SignatureCanvas from "react-signature-canvas";
    import { doc, setDoc } from "firebase/firestore";
    import { db } from "../services/firebase";
    import { useSearchParams } from "react-router-dom";

    export default function SignaturePad() {
    const sigRef = useRef<SignatureCanvas>(null);
    const [params] = useSearchParams();
    const session = params.get("session");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!session) {
        alert("❌ Invalid Session! Please scan QR again.");
        } else {
        console.log("✅ Session ID:", session);
        }
    }, [session]);

    const saveSignature = async () => {
        if (!session) {
        alert("Session ID missing!");
        return;
        }
        if (!sigRef.current || sigRef.current.isEmpty()) {
        alert("Please draw your signature first!");
        return;
        }

        setIsSaving(true);

        try {
        const image = sigRef.current.toDataURL("image/png");
        
        console.log("Saving to Firebase...", session);

        await setDoc(doc(db, "signatures", session), {
            image: image,
            createdAt: new Date().toISOString(),
            device: navigator.userAgent.includes("Mobile") ? "mobile" : "desktop",
            status: "completed"
        });

        alert("✅ Signature Sent Successfully!");
        
        // Clear canvas after success
        sigRef.current.clear();
        
        // Optional: Close window on mobile
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
            setTimeout(() => window.close(), 1000);
        }

        } catch (error) {
        console.error("Error saving signature:", error);
        alert("❌ Failed to save: " + error.message);
        } finally {
        setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Sign Here</h2>
            
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white touch-none">
            <SignatureCanvas
                ref={sigRef}
                penColor="black"
                canvasProps={{
                width: 350,
                height: 200,
                className: "signature-canvas",
                style: { touchAction: "none" } // Prevents scrolling while signing
                }}
            />
            </div>

            <button
            onClick={saveSignature}
            disabled={isSaving}
            className={`mt-5 w-full py-3 rounded-lg font-bold text-white transition-all ${
                isSaving 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-xl"
            }`}
            >
            {isSaving ? "Sending..." : "Submit Signature"}
            </button>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
            Draw above and tap Submit.
            </p>
        </div>
        </div>
    );
    }