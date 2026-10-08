import React, { useState } from 'react';
import { LogIn, User, Lock, AlertCircle } from 'lucide-react';
import { apiAuth } from '@/lib/api';

interface LoginPageProps {
  onLoginSuccess: (token: string, user: any) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // forgotStep: 0 = login, 1 = request otp, 2 = verify otp
  const [forgotStep, setForgotStep] = useState(0);
  const [forgotMessage, setForgotMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setForgotMessage('');

    if (forgotStep === 1) {
      if (!username || !email) {
        setError('Vui lòng nhập tên đăng nhập và email.');
        return;
      }
      setIsLoading(true);
      try {
        const response = await apiAuth.forgotPassword({ username, email });
        setForgotMessage(response.message || 'Mã OTP đã được gửi.');
        setForgotStep(2); // move to step 2
      } catch (err: any) {
        setError(err.message || 'Tên đăng nhập hoặc email không đúng.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (forgotStep === 2) {
      if (!otpCode || !newPassword) {
        setError('Vui lòng nhập mã xác nhận và mật khẩu mới.');
        return;
      }
      setIsLoading(true);
      try {
        const response = await apiAuth.resetPassword({ username, email, otpCode, newPassword });
        setForgotMessage(response.message || 'Đổi mật khẩu thành công. Vui lòng đăng nhập.');
        setForgotStep(0); // move back to login
        setPassword('');
      } catch (err: any) {
        setError(err.message || 'Mã xác nhận không đúng hoặc đã hết hạn.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (forgotStep === 0) {
      if (!username || !password) {
        setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiAuth.login({ username, password });
        if (response && response.accessToken) {
          onLoginSuccess(response.accessToken, response);
        } else {
          setError('Đăng nhập thất bại. Vui lòng thử lại.');
        }
      } catch (err: any) {
        setError(err.message || 'Có lỗi xảy ra khi kết nối đến máy chủ.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-6">
            <LogIn className="w-8 h-8 text-white transform rotate-6" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
          Chào mừng trở lại
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Đăng nhập để truy cập hệ thống quản lý
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            {forgotMessage && (
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md flex items-start">
                <p className="text-sm text-green-700">{forgotMessage}</p>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Tên đăng nhập
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  disabled={forgotStep === 2}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-3 bg-gray-50 text-gray-900 transition-colors disabled:opacity-50"
                  placeholder="Nhập tên đăng nhập của bạn"
                />
              </div>
            </div>

            {forgotStep === 1 && (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full px-4 sm:text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-3 bg-gray-50 text-gray-900 transition-colors"
                    placeholder="Nhập địa chỉ email của bạn"
                  />
                </div>
              </div>
            )}

            {forgotStep === 2 && (
              <>
                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                    Mã xác nhận (OTP)
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <input
                      id="otp"
                      name="otp"
                      type="text"
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="block w-full px-4 sm:text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-3 bg-gray-50 text-gray-900 transition-colors"
                      placeholder="Nhập mã xác nhận (6 số)"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                    Mật khẩu mới
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full pl-10 sm:text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-3 bg-gray-50 text-gray-900 transition-colors"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </>
            )}

            {forgotStep === 0 && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Mật khẩu
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 sm:text-sm border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 py-3 bg-gray-50 text-gray-900 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {forgotStep === 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                    Ghi nhớ đăng nhập
                  </label>
                </div>

                <div className="text-sm">
                  <button type="button" onClick={() => setForgotStep(1)} className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors bg-transparent border-none p-0 cursor-pointer">
                    Quên mật khẩu?
                  </button>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {isLoading ? 'Đang xử lý...' : (forgotStep === 1 ? 'Nhận mã xác nhận' : forgotStep === 2 ? 'Đổi mật khẩu' : 'Đăng nhập')}
              </button>
            </div>
            
            {forgotStep > 0 && (
              <div className="text-center mt-4">
                <button type="button" onClick={() => { setForgotStep(0); setForgotMessage(''); setError(''); }} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors bg-transparent border-none p-0 cursor-pointer">
                  Quay lại đăng nhập
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
