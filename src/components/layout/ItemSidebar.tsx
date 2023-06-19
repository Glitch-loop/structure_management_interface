
const ItemSidebar = (
  {
    label, 
    Icon,
    path, 
    isActive,
    handleRedirect
  }: {
    label: string, 
    Icon: any, 
    path: string,
    isActive: boolean,
    handleRedirect: (path: string) => void
  }) => {
  return (
    <button 
      onClick={() => handleRedirect(path)}
      className={`p-2 ml-1 mt-2 rounded-md ${isActive ? 'bg-slate-200' : 'transition ease-in-out duration-300 hover:bg-slate-200'}`}
    >
      <div className="flex flex-row justify-between">
        <div className="text-left">
          {label}
        </div>
        <div className="flex items-center">
          <Icon className={'text-[20px]'}/>
        </div>
      </div>
    </button>
  )
}

export default ItemSidebar;