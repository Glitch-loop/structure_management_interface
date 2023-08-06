import { useState } from 'react';
import { HiOutlineSearch } from "react-icons/hi";

interface IOption {
  id: number;
  data: string;
}

const Searcher = (
  {
    handleSearcher, 
    placeholder,
    optionsToShow,
    onSelectOption,
    onType,
  }: {
    handleSearcher?:any, 
    placeholder:string
    optionsToShow?: IOption[],
    onSelectOption?: any,
    onType?: any
  }) => {
  const [itemToSearch, setItemToSearch] = useState('');

  const handleType = (e:any):void => {
    e.preventDefault();
    if(e.key=="Enter" && handleSearcher !== undefined){
      handleSearcher(itemToSearch);
      setItemToSearch('');
    }
  }

  const handleSelection = (itemSelected:IOption):void => {
    if(onSelectOption !== undefined) {
      onSelectOption(itemSelected.id);
      setItemToSearch(itemSelected.data);
    } else setItemToSearch("");
  }
  
  return (
    <div className="flex flex-1 flex-col items-center gap-x-3">
      <div className="flex w-[400px] items-center bg-slate-100 rounded-full pl-3 py-1">
        <HiOutlineSearch className='text-gray-500'/>
        <input 
          className='rounded-full pl-1 py-1 appearance-none focus:outline-none bg-transparent flex-1 pr-3'
          placeholder={placeholder}
          value={itemToSearch}
          onChange={(e): void => {
            setItemToSearch(e.target.value);
            onType !== undefined && onType(e.target.value);
          }}
          onKeyUp={handleType}
        />
      </div>
      <div className='absolute z-10 mt-12 text-sm overflow-scroll max-h-48 flex flex-col'>
        { optionsToShow !== undefined && 
          optionsToShow.map(element => 
            <button
              onClick={() => { handleSelection(element) }
              }
              key={element.id}
              className='p-3 bg-gray-100 hover:bg-gray-200'
            >
              {element.data}
            </button>
          )
        }
      </div>
    </div>
  )
}

export default Searcher