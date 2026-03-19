import { useIsFocused } from "@react-navigation/native"
import { useCallback, useEffect, useRef } from "react"

export function usePickerLifecycleGuard() {
    const isFocused = useIsFocused()
    const isMountedRef = useRef(true)
    const isPickerActiveRef = useRef(false)

    useEffect(() => {
        return () => {
            isMountedRef.current = false
            isPickerActiveRef.current = false
        }
    }, [])

    const isScreenActive = useCallback(() => {
        return isMountedRef.current && isFocused
    }, [isFocused])

    const tryBeginPicker = useCallback(() => {
        if (isPickerActiveRef.current) {
            return false
        }

        isPickerActiveRef.current = true
        return true
    }, [])

    const endPicker = useCallback(() => {
        isPickerActiveRef.current = false
    }, [])

    return {
        endPicker,
        isScreenActive,
        tryBeginPicker,
    }
}
