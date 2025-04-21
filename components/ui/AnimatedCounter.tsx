import React from 'react'
import CountUp from 'react-countup'

const AnimatedCounter = ({ amount }: { amount: number }) => {
  return (
    <div className='W-full'>
      <CountUp
        duration={2}
        prefix='¥'
        end={amount} />
    </div>

  )
}

export default AnimatedCounter