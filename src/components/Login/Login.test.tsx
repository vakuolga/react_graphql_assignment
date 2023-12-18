import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import LOGIN from '../../apollo/auth';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '../../redux/store';
import LoginForm from './LoginForm';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import {renderHook} from '@testing-library/react'
import useAuthService from '../../hooks/useAuthService';
import { act } from '@testing-library/react';

import '@testing-library/jest-dom';

type Props = {
  children: JSX.Element
}

const wrapper = ({ children }: Props ) => {
return (
<Provider store={store}>
  <BrowserRouter>
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  </BrowserRouter>
</Provider>)
}

vi.mock('../../hooks/useAuthService', async () => {
  const actual = await vi.importActual("../../hooks/useAuthService");
  return {
    ...actual,
    userLoading: false,
    userError: null,
    login: vi.fn(),
    getUser: vi.fn(),
  };
});

const mocks = [
  {
    request: {
      query: LOGIN,
      variables: {
        loginJwtInput2: {
          email: 'example@email.com',
          password: 'securePassword123',
        },
      },
    },
    result: {
      data: {
        Auth: {
          loginJwt: {
            jwtTokens: {
              accessToken: 'mockedAccessToken',
              refreshToken: 'mockedRefreshToken',
            },
          },
        },
      },
    },
  },
];

describe('LoginComponent', () => {
  test('handles authentification', async () => {
    const mockData = {
      email: '',
      password: '',
    };
    const mockSetData = vi.fn()
    const mockSetError = vi.fn()

    render(
      <Provider store={store}>
        <BrowserRouter>
          <MockedProvider mocks={mocks} addTypename={false}>
            <LoginForm
              data={mockData}
              setData={mockSetData}
              setError={mockSetError}
            />
          </MockedProvider>
        </BrowserRouter>
      </Provider>
    );
    const mailfield = screen.getByTestId('email-input');
    const pwfield = screen.getByTestId('password-input');

    expect(mailfield).toBeInTheDocument();
    expect(pwfield).toBeInTheDocument();

    userEvent.type(mailfield, 'example@email.com');
    userEvent.type(pwfield, 'securePassword123');

    render(
      <Provider store={store}>
        <BrowserRouter>
          <MockedProvider mocks={mocks} addTypename={false}>
            <Login />
          </MockedProvider>
        </BrowserRouter>
      </Provider>
    );
    const { result } = renderHook(() => useAuthService(), {wrapper});
    await act(async () => {
      // Using renderHook to call login
      result.current.login(
        {
          email: 'example@email.com',
          password: 'securePassword123',
        }
      );
      // Wait for asynchronous operations to complete
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
      });
    });
  });
})