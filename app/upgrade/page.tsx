'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StarIcon from '@mui/icons-material/Star';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import DiamondIcon from '@mui/icons-material/Diamond';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useState, useRef } from 'react';
import { initializeRazorpayPayment } from '../utils/razorpay';

export default function UpgradePage() {
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [planType, setPlanType] = useState<'all' | 'individual' | 'business'>('all');
  const [showExpertModal, setShowExpertModal] = useState(false);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

    //extracting plan , amount and calling the backend for orderid
    const handlePayment = async (plan: { name: string, price: string }) => {
      try {
        // Extract numeric amount from price string
        const amount = parseInt(plan.price.replace('₹', '').replace(',', '')) * 100; // Convert to paise
  
        // Call your backend API to create an order
        const response = await fetch('/api/create-razorpay-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            amount, 
            currency: 'INR',
            planName: plan.name 
          }),
        });
  
        const data = await response.json();
  
        if (data.orderId) {
          // Initialize Razorpay payment
          await initializeRazorpayPayment(data.orderId, amount, 'INR');
        } else {
          throw new Error('Failed to create order');
        }
      } catch (error) {
        console.error('Payment initiation failed:', error);
        alert('Failed to initiate payment. Please try again.');
      }
    };
  
  

  const plans = [
    {
      name: 'Pro Individual',
      price: '₹999',
      period: '/month',
      icon: <WorkspacePremiumIcon sx={{ fontSize: 28 }} />,
      color: 'from-[#A2195E] to-[#BA1C6C]',
      type: 'individual',
      features: [
        'Advanced analytics',
        'Priority support',
        'Custom integrations',
        'Unlimited searches',
        'API access'
      ]
    },
    {
      name: 'Pro Business',
      price: '₹2,499',
      period: '/month',
      icon: <StarIcon sx={{ fontSize: 28 }} />,
      color: 'from-[#8A1550] to-[#D14B8F]',
      popular: true,
      type: 'business',
      features: [
        'Everything in Pro Individual',
        'Team collaboration',
        'Advanced reporting',
        'Bulk processing',
        'Dedicated account manager'
      ]
    },
    {
      name: 'Priority Business',
      price: '₹4,999',
      period: '/month',
      icon: <DiamondIcon sx={{ fontSize: 28 }} />,
      color: 'from-[#6A1141] to-[#E0228B]',
      type: 'business',
      features: [
        'Everything in Pro Business',
        'Enterprise API access',
        'Custom development',
        'SLA guarantees',
        'White-label options'
      ]
    }
  ];


  const filteredPlans = planType === 'all' 
    ? plans 
    : plans.filter(plan => plan.type === planType);

  

  return (
    <div className="min-h-screen bg-white">
      <main className="flex-1 overflow-y-auto">
        <motion.div 
          ref={containerRef}
          className="relative min-h-full"
          style={{
            backgroundImage: 'radial-gradient(circle at top right, rgba(162, 25, 94, 0.1), transparent 60%), radial-gradient(circle at bottom left, rgba(186, 28, 108, 0.1), transparent 60%)',
            backgroundSize: '100% 100%',
            y: backgroundY
          }}
        >
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-[#A2195E]/20 to-transparent rounded-full blur-3xl transform rotate-12 animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-[#BA1C6C]/20 to-transparent rounded-full blur-3xl transform -rotate-12 animate-pulse" />
          </div>

          <div className="px-6 pt-16 pb-24 relative">
            <div className="max-w-md mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="text-center mb-12 relative"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute -top-6 left-1/2 transform -translate-x-1/2"
                >
                  <AutoAwesomeIcon sx={{ fontSize: 40, color: '#A2195E' }} />
                </motion.div>
                <h1 className="text-3xl font-bold text-gray-900 mb-3">
                  Upgrade Your Experience
                </h1>
                <p className="text-gray-600 text-lg">
                  Choose the perfect plan for your journey
                </p>
              </motion.div>

              <div className="flex justify-center gap-4 mb-8">
                <button
                  onClick={() => setPlanType('all')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    planType === 'all'
                      ? 'bg-[#A2195E] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Plans
                </button>
                <button
                  onClick={() => setPlanType('individual')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    planType === 'individual'
                      ? 'bg-[#A2195E] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Individual
                </button>
                <button
                  onClick={() => setPlanType('business')}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    planType === 'business'
                      ? 'bg-[#A2195E] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Business
                </button>
              </div>

              <div className="space-y-6">
                {filteredPlans.map((plan, index) => (
                  <motion.div
                    key={plan.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    onHoverStart={() => setHoveredPlan(plan.name)}
                    onHoverEnd={() => setHoveredPlan(null)}
                    className="relative group"
                  >
                    {plan.popular && (
                      <motion.div 
                        className="absolute -top-3 -right-2 z-10"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.2 }}
                      >
                        <div className="bg-gradient-to-r from-[#A2195E] to-[#BA1C6C] text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                          Most Popular
                        </div>
                      </motion.div>
                    )}
                    <motion.div
                      className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-lg shadow-lg hover:shadow-2xl transition-all duration-500"
                      animate={{
                        scale: hoveredPlan === plan.name ? 1.02 : 1,
                        y: hoveredPlan === plan.name ? -5 : 0
                      }}
                    >
                      <div className={`bg-gradient-to-r ${plan.color} p-8 relative overflow-hidden`}>
                        <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-10" />
                        <div className="relative">
                          <div className="flex items-center gap-4 mb-6">
                            <motion.div
                              className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-lg flex items-center justify-center ring-2 ring-white/20"
                              whileHover={{ rotate: 360 }}
                              transition={{ duration: 0.7 }}
                            >
                              {plan.icon}
                            </motion.div>
                            <div>
                              <h3 className="text-white font-bold text-xl mb-1">
                                {plan.name}
                              </h3>
                              <div className="flex items-baseline gap-1">
                                <span className="text-white text-3xl font-bold">
                                  {plan.price}
                                </span>
                                <span className="text-white/70 text-sm">
                                  {plan.period}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-8">
                        <ul className="space-y-4">
                          {plan.features.map((feature, idx) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.1 + idx * 0.1 }}
                              className="flex items-center gap-3 text-gray-700"
                            >
                              <motion.div
                                whileHover={{ scale: 1.2, rotate: 360 }}
                                transition={{ duration: 0.3 }}
                              >
                                <CheckCircleIcon sx={{ fontSize: 24, color: '#A2195E' }} />
                              </motion.div>
                              <span className="font-medium">{feature}</span>
                            </motion.li>
                          ))}
                        </ul>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full mt-8 py-4 px-6 rounded-2xl bg-gradient-to-r ${plan.color} text-white font-semibold text-lg hover:shadow-xl hover:shadow-pink-200/30 transition-all duration-300 relative overflow-hidden group`}
                          //plan rendering 
                          onClick={() => handlePayment(plan)}
                        >
                          <span className="relative z-10">Get Started</span>
                          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <p className="text-gray-600 mb-4">Still confused about which plan to choose?</p>
                <button
                  onClick={() => setShowExpertModal(true)}
                  className="inline-flex items-center px-6 py-3 rounded-full text-sm font-medium bg-white border-2 border-[#A2195E] text-[#A2195E] hover:bg-[#A2195E] hover:text-white transition-all duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Talk to Our Expert
                </button>
              </div>

              {/* Expert Modal */}
              {showExpertModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-2xl p-6 max-w-md w-full relative"
                  >
                    <button
                      onClick={() => setShowExpertModal(false)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-[#A2195E] rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Get Expert Guidance</h3>
                      <p className="text-gray-600">Our experts are here to help you choose the perfect plan for your needs.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#A2195E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Schedule a Call</h4>
                          <p className="text-sm text-gray-600">Get personalized guidance from our experts</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#A2195E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Live Chat</h4>
                          <p className="text-sm text-gray-600">Chat with our support team instantly</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      <button
                        onClick={() => {
                          // Add scheduling logic here
                          window.location.href = "tel:+1234567890";
                        }}
                        className="w-full px-6 py-3 bg-[#A2195E] text-white rounded-lg font-medium hover:bg-[#8B1550] transition-colors duration-300"
                      >
                        Schedule a Call Now
                      </button>
                      <button
                        onClick={() => {
                          // Add chat logic here
                          setShowExpertModal(false);
                        }}
                        className="w-full px-6 py-3 bg-white border-2 border-[#A2195E] text-[#A2195E] rounded-lg font-medium hover:bg-gray-50 transition-colors duration-300"
                      >
                        Start Live Chat
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
