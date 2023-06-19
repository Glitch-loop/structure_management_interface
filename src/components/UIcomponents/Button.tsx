
const Button = ({label}: {label: string}) => {
  return (
    <button type="submit" className='z-0 mt-5 bg-blue-200 rounded-full p-3 hover:bg-blue-400'>
      {label}
    </button>
  )
}

export default Button;