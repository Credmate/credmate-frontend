'use client';

import { useState } from 'react';
import CreditScoreGauge from './CreditScoreGauge';
import '@/app/styles/layout.css';

export default function CreditScoreContainer() {
  const [activeScore, setActiveScore] = useState<'credmate' | 'cibil'>(
    'credmate'
  );

  return (
    <div className=' credit-score-section'>
      <div className='flex justify-center gap-2 mb-4'>
        <button
          onClick={() => setActiveScore('credmate')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            activeScore === 'credmate'
              ? 'bg-[#A2195E] text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          Credmate Score
        </button>
        <button
          onClick={() => setActiveScore('cibil')}
          className={`px-4 py-2 rounded-full text-sm font-medium ${
            activeScore === 'cibil'
              ? 'bg-[#A2195E] text-white'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          CIBIL Score
        </button>
      </div>

      <CreditScoreGauge scoreType={activeScore} />

      <p className='text-center text-[#8A8A8A] mx-1 mb-3 px-1'>
        Your{' '}
        <span className='text-[#A2195E]'>
          {activeScore === 'credmate' ? 'Credmate' : 'CIBIL'}
        </span>{' '}
        score is updated every 24 hours
      </p>
    </div>
  );
}
