export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
        <div className="flex gap-2 items-center">
          <div className="w-2 h-2 bg-primary-700 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
          <div className="w-2 h-2 bg-primary-700 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-primary-700 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}
