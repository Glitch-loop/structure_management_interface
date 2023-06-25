import { useState, useEffect } from 'react';
import { HiOutlineSearch } from "react-icons/hi";
const Searcher = ({handleSearcher}: {handleSearcher:any}) => {
  const [itemToSearch, setItemToSearch] = useState('');
  const handleType = (e:any):void => {
    e.preventDefault();
    if(e.key=="Enter"){
      handleSearcher(itemToSearch)
      setItemToSearch('')
    }
  }

  return (
    <div className="flex flex-1 items-center gap-x-3 mb-3">
      <div className="flex w-[400px] items-center bg-slate-100 rounded-full pl-3 py-1">
        <HiOutlineSearch className='text-gray-500'/>
        <input 
          className='rounded-full pl-1 py-1 appearance-none focus:outline-none bg-transparent flex-1 pr-3'
          placeholder='Find'
          value={itemToSearch}
          onChange={(e): void => {setItemToSearch(e.target.value)}}
          onKeyUp={handleType}
        />
      </div>
    </div>
  )
}

export default Searcher