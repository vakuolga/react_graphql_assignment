import {
  Observable,
  ApolloClient,
  InMemoryCache,
  HttpLink,
  from,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { setContext } from '@apollo/client/link/context';
import Cookies from 'js-cookie';
import { store } from '../redux/store';
import { addJwtTokens } from '../redux/feature/authSlice';
import fetch from 'cross-fetch';

const BASE_URL = 'https://staging.api.constellation.academy';

export const getRefreshToken = async () => {
  const refreshToken = Cookies.get('refresh-token');
  const accountId = Cookies.get('secret');
  if (!refreshToken || !accountId) return undefined;

  try {
    const response = await fetch(`${BASE_URL}/api/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken, accountId }),
    });

    if (!response.ok) {
      throw new Error(`Error refreshing token: ${response.status}`);
    }

    const data = await response.json();
    store.dispatch(addJwtTokens(data));
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    };
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

const httpLink = new HttpLink({
  uri: `${BASE_URL}/api/graphql`,
  fetch,
  credentials: 'include',
});

const authLink = setContext(async (_, { headers }) => {
  const token = store.getState().auth.accessToken || (await getRefreshToken());
  return {
    headers: {
      ...headers,
      authorization: token,
    },
  };
});

const createErrorLink = () => {
  return onError(({ graphQLErrors, operation, forward }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach((err) => {
        if (err.extensions?.code === 'UNAUTHENTICATED') {
          return new Observable((observer) => {
            getRefreshToken()
              .then((newTokens) => {
                if (newTokens) {
                  const oldHeaders = operation.getContext().headers;
                  operation.setContext({
                    headers: {
                      ...oldHeaders,
                      authorization: newTokens.accessToken,
                    },
                  });
                  const subscriber = {
                    next: observer.next.bind(observer),
                    error: observer.error.bind(observer),
                    complete: observer.complete.bind(observer),
                  };
                  forward(operation).subscribe(subscriber);
                } else {
                  observer.error(
                    new Error('Error: Missing refreshToken or accountId')
                  );
                }
              })
              .catch((refreshError) => {
                observer.error(refreshError);
              });
          });
        }
        return undefined;
      });
    }
    return new Observable((observer) => {
      const subscriber = {
        next: observer.next.bind(observer),
        error: observer.error.bind(observer),
        complete: observer.complete.bind(observer),
      };
      forward(operation).subscribe(subscriber);
    });
  });
};

const errorLink = createErrorLink();

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
    },
  },
});

export default client;
