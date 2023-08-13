import SVGIconWrapper from "./SVGIconWrapper";

function Qr(props: any) {
    return (
        <SVGIconWrapper width={24} height={24} {...props} >
            <path fill="#008ffb" d="M9 2H4C2.89543 2 2 2.89543 2 4V9C2 10.1046 2.89543 11 4 11H9C10.1046 11 11 10.1046 11 9V4C11 2.89543 10.1046 2 9 2ZM4 9V4H9V9H4Z" />
            <path fill="#008ffb" d="M9 13H4C2.89543 13 2 13.8954 2 15V20C2 21.1046 2.89543 22 4 22H9C10.1046 22 11 21.1046 11 20V15C11 13.8954 10.1046 13 9 13ZM4 20V15H9V20H4Z" />
            <path fill="#008ffb" d="M20 2H15C13.8954 2 13 2.89543 13 4V9C13 10.1046 13.8954 11 15 11H20C21.1046 11 22 10.1046 22 9V4C22 2.89543 21.1046 2 20 2ZM15 9V4H20V9H15Z" />
            <rect fill="#008ffb" width="3" height="3" rx="0.5" transform="matrix(-1 0 0 1 16 13)" />
            <rect fill="#008ffb" width="3" height="3" rx="0.5" transform="matrix(-1 0 0 1 22 13)" />
            <rect fill="#008ffb" width="3" height="3" rx="0.5" transform="matrix(-1 0 0 1 19 16)" />
            <rect fill="#008ffb" width="3" height="3" rx="0.5" transform="matrix(-1 0 0 1 22 19)" />
            <rect fill="#008ffb" width="3" height="3" rx="0.5" transform="matrix(-1 0 0 1 16 19)" />
        </SVGIconWrapper>
    );
}

export default Qr;