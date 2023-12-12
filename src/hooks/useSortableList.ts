import { useState, useEffect } from 'react';

export const STORAGE_KEY = 'sortableList';

const useSortableList = <T>(initialList: T[]) => {
  const [list, setList] = useState(initialList);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }, [list]);

  const moveItem = (from: number, to: number) => {
    const updatedList = [...list];
    console.log(from, to);
    const [movedItem] = updatedList.splice(from, 1);
    updatedList.splice(to, 0, movedItem);
    setList(updatedList);
  };

  return { list, moveItem, setList };
};

export default useSortableList;
