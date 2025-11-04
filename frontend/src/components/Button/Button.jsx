import './Button.css';

function Button({ variant, onClick, children }) {
    // Map our variants to Tailwind utility classes so dark: variants can be used immediately.
    // Keep the original CSS class names to avoid breaking existing styling while gradually
    // adopting Tailwind utilities.
    const twMap = {
        primary: 'bg-amber-600 text-white hover:brightness-95',
        secondary: 'bg-gray-800 text-white dark:bg-white dark:text-black hover:brightness-95',
        danger: 'bg-red-600 text-white hover:brightness-95'
    };

    const tw = twMap[variant] || 'bg-gray-200 text-gray-900';

    return (
    <button 
        className={`button ${variant ? `button--${variant}` : ''} ${tw} px-3 py-1 rounded-md`}
        onClick={onClick}
    >
        {children}
    </button>
    );
}

export default Button;
