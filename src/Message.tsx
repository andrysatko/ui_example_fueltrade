export default  function Mesage ({messages}:{messages: string[]}){
    return (
        <div>
            {
                messages.map((message, index) => (
                    <div key={index}>{message}</div>
                ))
            }
        </div>
    )
}