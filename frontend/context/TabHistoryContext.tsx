import { createContext, useContext, useState } from 'react';

const TabHistoryContext = createContext({
  lastTab: '/index',
  setLastTab: (path: string) => {},
});

export const TabHistoryProvider = ({ children }: { children: React.ReactNode }) => {
  const [lastTab, setLastTab] = useState('/index');
  return (
    <TabHistoryContext.Provider value={{ lastTab, setLastTab }}>
      {children}
    </TabHistoryContext.Provider>
  );
};

export const useTabHistory = () => useContext(TabHistoryContext);
