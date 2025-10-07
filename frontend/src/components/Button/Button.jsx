import './Button.css';

function Button({ variant, onClick, children }) {
    // children captures anything between the opening and closing tags of the Button component (like button text)
    return (
    <button 
        className={`button ${variant ? `button--${variant}` : ''}`}
        onClick={onClick}
    >
        {children}
    </button>
    );
}

export default Button;
