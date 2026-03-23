import { useCallback } from 'react';

// Declare Razorpay on window for TS
declare global {
  interface Window {
    Razorpay: any;
  }
}

export const useRazorpay = () => {
  const loadScript = (src: string) => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const displayRazorpay = useCallback(async (amount: number, onSuccess: (response: any) => void) => {
    const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      return;
    }

    const options = {
      key: 'rzp_test_placeholder_key', // Enter your Test Key ID here
      amount: amount * 100, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
      currency: 'INR',
      name: 'RegiBIZ Government Services',
      description: 'Service Payment',
      image: 'https://via.placeholder.com/150/0a192f/10b981?text=RegiBIZ',
      handler: function (response: any) {
        // Success callback
        // In real app: verify signature on backend
        onSuccess(response);
      },
      prefill: {
        name: 'RegiBIZ User',
        email: 'user@regibiz.com',
        contact: '9999999999',
      },
      theme: {
        color: '#0f766e', // Peacock color
      },
    };

    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  }, []);

  return { displayRazorpay };
};