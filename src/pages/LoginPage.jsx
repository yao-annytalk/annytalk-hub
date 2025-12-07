import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(emailInput, passwordInput);
      navigate('/crm'); // Redirect after success
    } catch (err) {
      alert("Login Failed: " + err.message);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center bg-cover bg-center bg-no-repeat" 
         style={{ backgroundImage: "url('/login-bg.svg')", backgroundColor: "#FFFFFF" }}>
      <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 h-full relative z-10">
        <div className="hidden md:block"></div>
        
        <div className="flex flex-col justify-end pb-20 items-center md:justify-center md:items-end md:pr-64 md:pb-0 h-full">
          
          <div className="w-full max-w-[300px] space-y-5 relative z-10"> 
            <form onSubmit={handleLogin} className="flex flex-col gap-5"> 
              
              <div className="text-right mb-[-10px] pr-2 relative z-10">
                <span className="text-[#33c4e5] text-xl font-bold font-sans">AnnyTalk</span>
                <span className="text-white bg-[#fcb625] px-1 ml-1 text-md font-bold rounded-sm">HUB</span>
              </div>

              <div className="bg-[#cef1f9]/95 backdrop-blur-sm w-full h-56 rounded-[40px] shadow-lg flex flex-col justify-end px-6 pb-6 gap-3 border-2 border-white/20">
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="w-full px-4 py-2 rounded-full outline-none text-center text-gray-600 text-md bg-white border-none h-12 shadow-inner font-regular font-sans"
                  value={emailInput} 
                  onChange={(e) => setEmailInput(e.target.value)}
                />
                
                <input 
                  type="password" 
                  placeholder="Password" 
                  className="w-full px-4 py-2 rounded-full outline-none text-center text-gray-600 text-md bg-white border-none h-12 shadow-inner font-regular font-sans"
                  value={passwordInput} 
                  onChange={(e) => setPasswordInput(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="w-full py-3 bg-[#33c4e5] text-white rounded-full font-bold text-xl hover:brightness-95 transition-transform active:scale-95 shadow-lg tracking-wider font-sans border-2 border-white/30"
              >
                Login
              </button>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
}