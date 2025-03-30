import { BrowserRouter as Router, Routes, Route} from "react-router-dom";
import Register from "./Register.jsx";
import Login from "./Login.jsx";
import Dashboard from "./Dashboard.jsx";
import ActiveCore from "./HalamanCore/activeCore.jsx";
import PostCore from "./HalamanCore/postCore.jsx";
import ChatCore from "./HalamanCore/chatCore.jsx";
import ChatBox from "./ChatMain/ChatBox.jsx";
import ChatList from "./ChatMain/ChatList.jsx";
import PostMain from "./PostMain/PostMain.jsx";
import LandingPage from "./LandingPage.jsx";
import ProfileMain from "./profile/ProfileMain.jsx"
import PostDetail from "./Comment/CommnetForm.jsx";
import { useEffect } from "react"; 
import { PWAPrompt } from "./components/PWAPrompt.jsx";
import { PWAInstallButton } from "./components/PWAInstallButton.jsx";
function App() {
    useEffect(() => {
        const token = localStorage.getItem("token");

        if(!token) {
            localStorage.removeItem("token");
            localStorage.removeItem("userId");
        }
    },[]);
    return (
        <Router>
            <div className="flex min-h-screen bg-gray-100">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/chat" element={<ChatCore />} />
                    <Route path="/chatlist" element={<ChatList />} />
                    <Route path="/active" element={<ActiveCore />} />
                    <Route path="/post" element={<PostCore />} />
                    <Route path="/postmain" element={<PostMain/>} />
                    <Route path="/active/chat/:id" element={<ChatBox />} />
                    <Route path="/chatlist/chat/:id" element={<ChatBox />} />
                    <Route path="/profile" element={<ProfileMain />} />
                    <Route path="/post/:id" element={<PostDetail />} />
                </Routes>
                < PWAPrompt />
                < PWAInstallButton />
            </div>
        </Router>
    );
}

export default App;
