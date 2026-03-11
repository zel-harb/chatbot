export default function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      {/* Bot avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(135deg, #52B7FF, #9B6FFF)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15
      }}>🤖</div>

      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px 16px 16px 4px',
        padding: '12px 20px',
        display: 'flex', gap: 6, alignItems: 'center'
      }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#52B7FF',
          animation: 'bounce 1.4s infinite ease-in-out both',
          animationDelay: '0s'
        }} />
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#9B6FFF',
          animation: 'bounce 1.4s infinite ease-in-out both',
          animationDelay: '0.16s'
        }} />
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#52B7FF',
          animation: 'bounce 1.4s infinite ease-in-out both',
          animationDelay: '0.32s'
        }} />
      </div>
    </div>
  )
}
