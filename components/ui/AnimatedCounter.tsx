import React from 'react'
import CountUp from 'react-countup'

const AnimatedCounter = ({amount}:{amount: number}) => {
  return (
    <div className='W-full'>
        <CountUp 
            duration={3}
            decimals={2}
            decimal=','
            prefix='$'
            end={amount}/>
    </div>

  )
}

export default AnimatedCounter