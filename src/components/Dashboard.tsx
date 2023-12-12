/* eslint-disable @typescript-eslint/no-shadow */
import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Button } from '@mui/material';
import { useQuery } from '@apollo/client';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { GET_USER_NODES } from '../apollo/user';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { userSelector } from '../redux/feature/userSlice';
import resetAll from '../redux/feature/resetAllSlice';
import client from '../apollo/client';
import { UserData } from '../apollo/interfaces';
import EdgesListMemo from './List';
import useSortableList from '../hooks/useSortableList';

function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const user = useAppSelector(userSelector); // get this from cache & compare to useParams() id?
  const bottom = useRef(null);

  const [isLoggedOut, setIsLoggedOut] = useState(false);

  const { data, loading, fetchMore } = useQuery(GET_USER_NODES, {
    variables: {
      after: null,
      first: 10,
    },
  });
  const { list, moveItem, setList } = useSortableList(
    data?.Admin.Tree.GetContentNodes.edges || []
  );

  const updateList = useCallback(
    (newList) => {
      // Обновление списка из loadMore()
      setList((prevList) => [...prevList, ...newList]);
    },
    [setList]
  );

  const getHasNextPage = useCallback(
    (data: UserData) =>
      data ? data.Admin.Tree.GetContentNodes.pageInfo.hasNextPage : true,
    []
  );

  const getAfter = useCallback(
    (data: UserData) =>
      data && data?.Admin.Tree.GetContentNodes.pageInfo
        ? data.Admin.Tree.GetContentNodes.pageInfo.endCursor
        : null,
    []
  );

  const loadMore = useCallback(async () => {
    if (isLoggedOut) return;
    const nextPage = getHasNextPage(data);
    const after = getAfter(data);

    if (nextPage && after !== null) {
      await fetchMore({
        variables: { after, first: 10 },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          if (!fetchMoreResult) return previousResult;

          const newEdges = fetchMoreResult.Admin.Tree.GetContentNodes.edges;

          client.writeQuery({
            query: GET_USER_NODES,
            variables: { after, first: 10 },
            data: {
              Admin: {
                ...fetchMoreResult.Admin,
                Tree: {
                  ...fetchMoreResult.Admin.Tree,
                  GetContentNodes: {
                    __typename: 'GetContentNodes',
                    edges: [
                      ...previousResult.Admin.Tree.GetContentNodes.edges,
                      ...newEdges,
                    ],
                    pageInfo:
                      fetchMoreResult.Admin.Tree.GetContentNodes.pageInfo,
                  },
                },
              },
            },
          });
          updateList(newEdges); // Обновление списка в Dashboard
          return {
            Admin: {
              ...previousResult.Admin,
              Tree: {
                ...previousResult.Admin.Tree,
                GetContentNodes: {
                  __typename: 'GetContentNodes',
                  edges: [
                    ...previousResult.Admin.Tree.GetContentNodes.edges,
                    ...newEdges,
                  ],
                  pageInfo: fetchMoreResult.Admin.Tree.GetContentNodes.pageInfo,
                },
              },
            },
          };
        },
      });
    }
  }, [data, fetchMore, getHasNextPage, getAfter, isLoggedOut, updateList]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (!isLoggedOut) loadMore();
      }
    });
    observer.observe(bottom.current);
    return () => {
      observer.disconnect();
    };
  }, [data, fetchMore, loadMore, isLoggedOut]);

  useEffect(() => {
    if (!user.name) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleLogout = () => {
    dispatch(resetAll());
    Cookies.remove('access-token');
    client.resetStore();
    setIsLoggedOut(true);
    navigate('/login');
  };

  return (
    <>
      <Button variant="outlined" onClick={() => handleLogout()}>
        Logout
      </Button>
      <h2>{user?.name || 'No username'}</h2>
      {/* <EdgesListMemo edges={data && data.Admin.Tree.GetContentNodes.edges} /> */}
      <EdgesListMemo edges={list} moveItem={moveItem} />
      {loading && 'Loading...'}
      <div ref={bottom} />
    </>
  );
}

export default Dashboard;