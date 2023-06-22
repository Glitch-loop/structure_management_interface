import { useState, useEffect } from 'react';
import { HiOutlineSearch } from "react-icons/hi";
const Searcher = ({handleSearcher}: {handleSearcher:any}) => {
  const [groupToSearch, setGroupToSearch] = useState('');
  const handleType = (e:any):void => {
    e.preventDefault();
    if(e.key=="Enter"){
      handleSearcher(groupToSearch)
      setGroupToSearch('')
    }
  }

  return (
    <div className="flex flex-1 items-center gap-x-3">
      <div className="flex w-[400px] items-center bg-slate-100 rounded-full pl-3 py-1">
        <HiOutlineSearch className='text-gray-500'/>
        <input 
          className='rounded-full pl-1 py-1 appearance-none focus:outline-none bg-transparent flex-1 pr-3'
          placeholder='Find'
          value={groupToSearch}
          onChange={(e): void => {setGroupToSearch(e.target.value)}}
          onKeyUp={handleType}
        />
      </div>
    </div>
  )
}

export default Searcher