import {useContext, useEffect, useState} from "react";
import {Navigate} from "react-router-dom";
import {UserContext} from "../UserContext";
import jwt_decode from "jwt-decode"

export default function LoginPage() {
  const [username,setUsername] = useState('');
  const [password,setPassword] = useState('');
  const [redirect,setRedirect] = useState(false);
  const {setUserInfo} = useContext(UserContext);

  const [ user, setUser ] = useState({})

  async function login(ev) {
    ev.preventDefault();
    const response = await fetch('http://localhost:4000/login', {
      method: 'POST',
      body: JSON.stringify({username, password}),
      headers: {'Content-Type':'application/json'},
      credentials: 'include',
    });
    if (response.ok) {
      response.json().then(userInfo => {
        setUserInfo(userInfo);
        setRedirect(true);
      });
    } else {
      alert('Sai thông tin đăng nhập');
    }
  }

  async function handleCallbackResponse(response) {
    //console.log("Encoded JWT ID token: " + response.credential);
    var userObject = jwt_decode(response.credential);
    //console.log(userObject);
    setUser(userObject);
    
    // Kiểm tra xem người dùng đã đăng nhập bằng tài khoản Google hay chưa
    if (userObject) {
      console.log("Login with Google successful");
      const response = await fetch('http://localhost:4000/googleLogin', {
        method: 'POST',
        body: JSON.stringify({ user: userObject }),
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
    });
    if (response.ok) {
      response.json().then(userInfo => {
        setUserInfo(userInfo);
        setRedirect(true);
      });
    } else {
      alert('Sai thông tin đăng nhập');
    }
      
    }
  }
  

  useEffect(() => {
    /* global google */ 
    google.accounts.id.initialize({
      client_id: "598719205971-mlhlhjlotlra4hd67tu3pl0h0b7gg7nb.apps.googleusercontent.com",
      callback: handleCallbackResponse
    });

    google.accounts.id.renderButton(
      document.getElementById("signInDiv"),
      { them: "outline", size: "large"}
    )

  }, [])

  if (redirect) {
    return <Navigate to={'/'} />
  }
  return (
    <div className="LoginPage-form-wrap">
      <form className="login LoginPage-form" onSubmit={login}>
        <h1>Đăng nhập</h1>
        <input type="text"
               placeholder="Tên tài khoản"
               value={username}
               onChange={ev => setUsername(ev.target.value)}/>
        <input type="password"
               placeholder="Mật khẩu"
               value={password}
               onChange={ev => setPassword(ev.target.value)}/>
        <button>Đăng nhập</button>
      </form>
      <p className="loginPage-OR">Hoặc</p>
      <div id='signInDiv'></div>
    </div>
  );
}