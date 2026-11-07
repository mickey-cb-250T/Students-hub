import * as React from "react"
import "./login.css"
import PWAInstallButton from "./PWAInstallButton"
type Props={onAuthenticated:(token:string)=>void;onGuest:()=>void}
type AuthResponse={token?:string;user?:any;error?:string}
const API=(import.meta.env.VITE_API_URL?.trim()||"/api").replace(/\/$/,"")

export default function LoginPage({onAuthenticated,onGuest}:Props){
 const [mode,setMode]=React.useState<"login"|"register">("login")
 const [show,setShow]=React.useState(false),[busy,setBusy]=React.useState(false),[error,setError]=React.useState("")
 async function submit(event:React.FormEvent<HTMLFormElement>){
  event.preventDefault();setError("");setBusy(true)
  const data=new FormData(event.currentTarget)
  const payload:Record<string,string>={email:String(data.get("email")||"").trim(),password:String(data.get("password")||"")}
  if(mode==="register"){payload.name=String(data.get("name")||"").trim();payload.college=String(data.get("college")||"").trim()}
  try{
   const response=await fetch(`${API}/auth/${mode}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)})
   const result=await response.json() as AuthResponse
   if(!response.ok)throw Error(result.error||"Please check your details and try again.")
   if(!result.token)throw Error("The server did not return a sign-in token.")
   onAuthenticated(result.token)
  }catch(cause){
   setError(cause instanceof TypeError?"Cannot reach the Students Hub server. Make sure the backend is running, then try again.":cause instanceof Error?cause.message:"Something went wrong. Please try again.")
  }finally{setBusy(false)}
 }
 return <main className="auth-page">
  <div className="auth-orb auth-orb-one"/><div className="auth-orb auth-orb-two"/>
  <div className="auth-shell">
   <section className="auth-story" aria-label="About Students Hub">
    <a className="auth-brand" href="#home"><b>c/</b><span>campus<span>.</span></span></a>
    <div className="auth-story-copy"><div className="auth-kicker"><i/> MADE FOR THE WAY STUDENTS LEARN</div><h1>Your next<br/>bright idea<br/><em>starts here.</em></h1><p>A little more clarity. A lot less last-minute panic. Find your people and make this semester feel lighter.</p></div>
    <div className="auth-note"><strong>*</strong><span><b>Good notes travel.</b><small>Share what helped. Find what you need.</small></span><i>-&gt;</i></div>
    <div className="auth-story-foot"><span>YOUR CAMPUS, IN ONE COMMON ROOM</span><span>01 - 03</span></div>
   </section>
   <section className="auth-panel">
    <div className="auth-mobile-brand"><b>c/</b> campus<span>.</span></div>
    <div className="auth-panel-top"><span className="auth-online"><i/> YOUR STUDY SPACE IS READY</span><PWAInstallButton compact /></div>
    <div className="auth-heading"><div className="auth-overline">{mode==="login"?"WELCOME BACK":"YOUR PEOPLE ARE HERE"}</div><h2>{mode==="login"?<>Pick up where<br/>you left off.</>:<>Make room for<br/>better study days.</>}</h2><p>{mode==="login"?"Sign in to get back to your campus.":"Create your free student account to join in."}</p></div>
    <div className="auth-tabs" role="tablist" aria-label="Account options">
     <button type="button" role="tab" aria-selected={mode==="login"} className={mode==="login"?"selected":""} onClick={()=>{setMode("login");setError("")}}>Sign in</button>
     <button type="button" role="tab" aria-selected={mode==="register"} className={mode==="register"?"selected":""} onClick={()=>{setMode("register");setError("")}}>Create account</button>
    </div>
    <form className="auth-form" onSubmit={submit}>
     {mode==="register"&&<><label htmlFor="auth-name">Your name</label><input id="auth-name" name="name" placeholder="e.g. Priyanshu Puri" autoComplete="name" required minLength={2}/></>}
     <label htmlFor="auth-email">College email</label><input id="auth-email" name="email" type="email" placeholder="you@college.edu" autoComplete="email" required/>
     {mode==="register"&&<><label htmlFor="auth-college">College <small>OPTIONAL</small></label><input id="auth-college" name="college" placeholder="Your college or university" autoComplete="organization"/></>}
     <div className="auth-password-label"><label htmlFor="auth-password">Password</label>{mode==="login"&&<small>At least 6 characters</small>}</div>
     <div className="auth-password-wrap"><input id="auth-password" name="password" type={show?"text":"password"} placeholder="Enter your password" autoComplete={mode==="login"?"current-password":"new-password"} required minLength={6}/><button type="button" onClick={()=>setShow(v=>!v)} aria-label={show?"Hide password":"Show password"}>{show?"HIDE":"SHOW"}</button></div>
     {error&&<div className="auth-error" role="alert"><b>!</b>{error}</div>}
     <button className="auth-submit" type="submit" disabled={busy}><span>{busy?(mode==="login"?"Signing you in...":"Creating your account..."):(mode==="login"?"Sign in to campus":"Create my account")}</span><b>-&gt;</b></button>
    </form>
    <div className="auth-divider"><i/> OR <i/></div><button className="auth-guest" type="button" onClick={onGuest}>Take a look around first <b>-&gt;</b></button>
    <p className="auth-terms">By continuing, you agree to use this space kindly and respect your classmates' work.</p>
   </section>
  </div>
  <footer className="auth-footer"><span>(c) CAMPUS COMMON ROOM</span><span>BUILT FOR BETTER STUDY DAYS <b>*</b></span></footer>
 </main>
}
