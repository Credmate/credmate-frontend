declare global {
    interface Window {
      Razorpay: any;
    }
  }
  
  export const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const verifyPayment = async (paymentData: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
    try {
      const response = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
  
      if (!response.ok) {
        throw new Error('Payment verification failed');
      }
  
      const result = await response.json();
      return result.verified;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  };
  
  export const initializeRazorpayPayment = async (orderId: string, amount: number, currency: string) => {
    const res = await loadRazorpayScript();
  
    if (!res) {
      alert('Razorpay SDK failed to load. Are you online?');
      return;
    }
  
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      amount: amount,
      currency: currency,
      name: 'Your Company Name',
      description: 'Pro Individual Plan Subscription',
      order_id: orderId,
      handler: async function (response: any) {
        const paymentData = {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        };
  
        const isVerified = await verifyPayment(paymentData);
  
        if (isVerified) {
          alert('Payment successful and verified. Payment ID: ' + response.razorpay_payment_id);
          // Here you can update the UI or redirect the user to a success page
        } else {
          alert('Payment verification failed. Please contact support.');
        }
      },
      prefill: {
        name: 'User Name',
        email: 'user@example.com',
        contact: 'user_contact_number'
      },
      theme: {
        color: '#A2195E'
      }
    };
  
    const paymentObject = new window.Razorpay(options);
    paymentObject.open();
  };
  
  