import React,{useState, useEffect} from 'react'
import axios from 'axios';
import {useNavigate} from 'react-router-dom'
import { useContext } from 'react';
import { AppContext } from '../context/context';
import toast from 'react-hot-toast';

const Auth = () => {
    const [isSignup, setIsSignup] = useState(true);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });

     const navigate = useNavigate();
    const {user, setUser } = useContext(AppContext); 
    const token = localStorage.getItem("authToken");

    useEffect(() => {
      if (user && token) {
        navigate('/agent');
    }
    }, [user,token])
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = isSignup ? '/auth/register' : '/auth/login';
        const payload = isSignup
            ? { username: formData.username, email: formData.email, password: formData.password }
            : { email: formData.email, password: formData.password };
            try {
            const response = await axios.post(`http://localhost:3000${endpoint}`, payload);
            const { token, user:authUser } = response.data;
            localStorage.setItem('authToken', token);
            setUser(authUser)
            toast.success(isSignup ? 'Registration successful!' : 'Login successful!');
            navigate('/agent');
        } catch (error) {
            toast.error("Invalid or missing cradentials!");
        }
    }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            {/* Header */}
            <div className="text-center mb-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                    {isSignup ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-gray-600">
                    {isSignup ? 'Join us today and start exploring' : 'Sign in to your account'}
                </p>
            </div>

            {/* Form */}
            <form onSubmit={(e) => handleSubmit(e)} className="space-y-5 text-black">
                {isSignup && (
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder="Enter your username"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition duration-200"
                        />
                    </div>
                )}
                
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter your email"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition duration-200"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Password
                    </label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter your password"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition duration-200"
                    />
                </div>

                {/* Submit Button */}
                <button 
                    type="submit"
                    className="w-full bg-linear-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition duration-200 transform hover:scale-105 shadow-lg cursor-pointer"
                >
                    {isSignup ? 'Sign Up' : 'Log In'}
                </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                </div>
            </div>

            {/* Toggle Button */}
            <button 
                onClick={() => setIsSignup(!isSignup)}
                className="w-full border-2 border-purple-600 text-purple-600 font-semibold py-3 rounded-lg hover:bg-purple-50 transition duration-200 cursor-pointer"
            >
                {isSignup ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}
            </button>
        </div>
    </div>
  )
}

export default Auth