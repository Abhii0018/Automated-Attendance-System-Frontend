const Loader = ({ fullScreen = false, size = "md", text = "" }) => {
  const sizes = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-[3px]",
  };

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#06070a] flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-[3px] border-blue-500/10 border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            </div>
          </div>
          <p className="text-slate-400 text-sm tracking-widest uppercase">
            Loading
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${sizes[size]} rounded-full border-blue-500/20 border-t-blue-500 animate-spin`}
      />
      {text && (
        <p className="text-slate-400 text-sm animate-pulse">{text}</p>
      )}
    </div>
  );
};

export default Loader;