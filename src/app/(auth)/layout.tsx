export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout">
      {children}
      <style>{`
        .auth-layout {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--lk-black);
          background-image: 
            radial-gradient(ellipse at 20% 80%, rgba(123,47,190,0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(255,45,155,0.1) 0%, transparent 50%);
        }
      `}</style>
    </div>
  );
}