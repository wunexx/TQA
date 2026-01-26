interface NavButtonProps{
    text?: string;
    link?: string;
}

export function NavButton({text="Button", link="#"}: NavButtonProps){
    return(
        <a href={link} className="nav-btn">{text}</a>
    )
}