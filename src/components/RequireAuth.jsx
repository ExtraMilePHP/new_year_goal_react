import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { loginUser } from '../store/authSlice';

export default function RequireAuth({ children }) {
  const dispatch = useDispatch();
  const location = useLocation();
  const { status, user } = useSelector((s) => s.auth);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(loginUser());
    }
  }, [status, dispatch]);

  if (status === 'loading' || status === 'idle') {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(226,85,105,.25)',
            borderTopColor: '#e25569',
            borderRadius: '50%',
            animation: 'spin .8s linear infinite',
          }}
        />
      </div>
    );
  }

  if (!user || status === 'failed') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
