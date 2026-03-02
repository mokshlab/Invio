/**
 * Reusable loading spinner with size variants.
 * @param {Object}  props
 * @param {boolean} [props.fullScreen=false] — centre in viewport
 * @param {boolean} [props.inline=false]     — no wrapper padding (use inside buttons)
 * @param {'sm'|'md'|'lg'} [props.size='md']
 */
const LoadingSpinner = ({ fullScreen = false, inline = false, size = 'md' }) => {
  const sizes = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div
      className={`${sizes[size]} border-[3px] border-primary-200 border-t-primary-600 rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        {spinner}
      </div>
    );
  }

  if (inline) return spinner;

  return <div className="flex items-center justify-center py-8">{spinner}</div>;
};

export default LoadingSpinner;
