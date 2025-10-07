import './InputField.css'

function InputField({ id, name, type, placeholder, value, onChange, autoComplete }) {
  return (
    <div className="field">
      <input
        id={id}
        name={name}
        type={type}
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
    </div>
  );
}

export default InputField;
