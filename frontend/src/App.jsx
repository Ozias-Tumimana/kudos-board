import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Banner from './components/Banner';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import BoardPage from './pages/BoardPage';
import './App.css';

// Root: persistent Header/Footer + routed page. The Banner is part of the home
// route only. Board list and card state live in the page that owns them.
function App() {
  return (
    <div className="app">
      <Header />
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Banner />
              <HomePage />
            </>
          }
        />
        <Route path="/boards/:boardId" element={<BoardPage />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
