import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-white px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
      <div className="max-w-max mx-auto">
        <main className="sm:flex">
          <p className="text-4xl font-extrabold text-indigo-600 sm:text-5xl">404</p>
          <div className="sm:ml-6">
            <div className="sm:border-l sm:border-gray-200 sm:pl-6">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
                페이지를 찾을 수 없습니다
              </h1>
              <p className="mt-4 text-base text-gray-500">
                요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
              </p>
            </div>
            <div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
              <Link to="/">
                <Button variant="primary">홈으로 이동</Button>
              </Link>
              <Link to="/products">
                <Button variant="secondary">쇼핑하기</Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotFound;