export default (state, action) => {
    switch (action.type) {
        case "JOINED":
            return {
                ...state,
                token: action.payload.token,
                user: action.payload.user,
                meetings: action.payload.meetings,
            };
        case "MEETING:CREATE": {
            return {
                ...state,
                meetings: [...state.meetings, action.payload.meeting],
            }
        }
        case "MEETING:JOIN": {
            return {
                ...state,
                meeting: action.payload.meeting,
                participants: action.payload.participants,
            }
        }
        case "SET_PARTICIPANTS": {
            return {
                ...state,
                participants: action.payload.participants,
            }
        }
        case "SET_MESSAGES": {
            return {
                ...state,
                messages: action.payload.messages,
            }
        }
        case "NEW_MESSAGE": {
            return {
                ...state,
                messages: [...state.messages, action.payload]
            }
        }
        default:
            return state;
    }
};
