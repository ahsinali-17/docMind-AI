import React, { useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/context'

const Protector = ({ children }) => {
  const navigate = useNavigate()
  const { user, loading } = useContext(AppContext)

  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  if (!user && loading) return <div className='w-full text-center font-semibold text-white'> Loading... </div>

  return children
}

export default Protector