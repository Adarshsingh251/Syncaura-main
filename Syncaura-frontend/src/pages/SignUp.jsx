import { useState } from 'react'
import { UserRound, Mail, LockKeyhole, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { FaGithub, FaFacebookF } from 'react-icons/fa'
import leftArt from "../assets/left-art.png";
import "./style9.css";
import api from "../config/axios.js";
import { useNavigate } from "react-router-dom";

function PasswordField({ label, value, onChange }) {
  const [visible, setVisible] = useState(false)
  return <label className="field">
    <LockKeyhole size={19} strokeWidth={1.8} />
    <input type={visible ? 'text' : 'password'} placeholder={label} value={value} onChange={onChange} required />
    <button type="button" className="reveal" aria-label={`Show ${label}`} onClick={() => setVisible(!visible)}>
      {visible ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  </label>
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false);
  const update = key => event => setForm({ ...form, [key]: event.target.value })

  async function handleSubmit(event) {
    event.preventDefault();

    // Validate required fields
    // if (!form.name) {
    if (!form.name.trim()) {
      setMessage("Name is required.");
      return;
    }
	// if (!form.email) {
  if (!form.email.trim()) {
		setMessage("Email is required.");
		return;
	}
	// Validate email format
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	// if (!emailRegex.test(form.email)) {
  if (!emailRegex.test(form.email.trim())) {
		setMessage("Invalid email address.");
		return;
	}
    // if (!form.password) {
    if (!form.password.trim()) {
      setMessage("Password is required.");
      return;
    }
    // if (!form.confirm) {
    if (!form.confirm.trim()) {
      setMessage("Confirm password is required.");
      return;
    }
    // Check password match
    // if (form.password !== form.confirm) {
    if (form.password.trim() !== form.confirm.trim()) {
      setMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await api.post("/auth/register", {
        // name: form.name,
        // email: form.email,
        // password: form.password,
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
      });

      console.log("Register success:", response.data);

      setMessage("Account created successfully!");

      setTimeout(() => {
        navigate("/signin");
      }, 1000);

    } catch (error) {
      console.log("Register error:", error.response?.data);
      // Show specific server error if available, otherwise generic message
      const serverMsg = error.response?.data?.message;
      if (serverMsg) {
        setMessage(serverMsg);
      } else {
        setMessage("Registration failed.");
      }
    }
    finally {
      setIsLoading(false);
    }
  }

  return <main className="page"><section className="auth-card">
    <aside className="art" aria-hidden="true"><img src={leftArt} alt="" /></aside>
    <div className="form-pane"><form onSubmit={handleSubmit}>
      <p className="eyebrow">START YOUR JOURNEY</p>
      <h1>Create <em>Account</em></h1>
      <p className="lead">Join us and explore what's possible.</p>
      <div className="fields">
        <label className="field"><UserRound size={19} strokeWidth={1.8} /><input placeholder="Full name" value={form.name} onChange={update('name')} required /></label>
        <label className="field"><Mail size={19} strokeWidth={1.8} /><input type="email" placeholder="Email" value={form.email} onChange={update('email')} required /></label>
        <PasswordField label="Password" value={form.password} onChange={update('password')} />
        <PasswordField label="Confirm password" value={form.confirm} onChange={update('confirm')} />
      </div>
      <label className="check"><input type="checkbox" required /><span>I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>.</span></label>
      
      <button className="submit" type="submit" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create Account"}
      </button>

      {message && <p className="message" role="status">{message}</p>}
      <div className="divider"><span>OR CONTINUE WITH</span></div>
      <div className="socials">
        <button type="button" aria-label="Continue with Google"><FcGoogle size={23} /></button>
        <button type="button" aria-label="Continue with GitHub"><FaGithub size={22} /></button>
        <button type="button" className="facebook" aria-label="Continue with Facebook"><FaFacebookF size={19} /></button>
      </div>
      <p className="switch">Already have an account? <a href="/signin">Log In</a></p>
    </form></div>
  </section></main>
}
