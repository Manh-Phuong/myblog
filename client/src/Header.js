import {Link} from "react-router-dom";
import {useContext, useEffect, useState} from "react";
import {UserContext} from "./UserContext";

export default function Header() {
  const {setUserInfo,userInfo} = useContext(UserContext);
  useEffect(() => {
    fetch('http://localhost:4000/profile', {
      credentials: 'include',
    }).then(response => {
      response.json().then(userInfo => {
        setUserInfo(userInfo);
      });
    });
  }, []);

  function logout() {
    fetch('http://localhost:4000/logout', {
      credentials: 'include',
      method: 'POST',
    });
    setUserInfo(null);
  }

  const username = userInfo?.username;

  return (
    <header>
      <Link to="/" className="logo Header-logo">MyBlog</Link>
      <nav>
        {username && (
          <>
            <div className="Header-create"><Link to="/create">Tạo bài mới</Link></div>
            <div className="Header-logout"> <a onClick={logout}><span className="Header-logout-label">Đăng xuất</span> ({username})</a></div>
          </>
        )}
        {!username && (
          <>
            <Link to="/login" className="Header-Login">Đăng nhập</Link>
            <Link to="/register" className="Header-Register">Đăng ký</Link>
          </>
        )}
      </nav>
    </header>
  );
}
