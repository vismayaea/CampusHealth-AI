import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';

const mockLogin = jest.fn();

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    googleLogin: jest.fn(),
    isLoading: false
  })
}));

jest.mock('../firebase', () => ({
  firebaseAuth: null,
  isFirebaseConfigured: false
}));

describe('LoginPage', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockLogin.mockResolvedValue({
      success: true,
      user: { role: 'student' }
    });
  });

  it('keeps easy demo Gmail sign in available', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /student/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'aarav.mehta@university.edu',
        password: 'password123',
        rememberMe: true
      });
    });
  });
});
