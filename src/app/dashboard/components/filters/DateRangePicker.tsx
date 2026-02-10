import React, { useMemo } from 'react'
import { useTheme, alpha } from '@mui/material/styles'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { CalendarTodayOutlined } from '@mui/icons-material'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onChange: (start: string, end: string) => void
  className?: string
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  className = '',
}) => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const handleStartDateChange = (date: any) => {
    if (date) {
      onChange(date.format('DD-MM-YYYY'), endDate)
    }
  }

  const handleEndDateChange = (date: any) => {
    if (date) {
      onChange(startDate, date.format('DD-MM-YYYY'))
    }
  }

  const { labelSx, valueSx, commonFieldStyles, dividerColor } = useMemo(() => {
    const labelColor = isDark ? '#E2E8F0' : '#6A7282'
    const inputColor = isDark ? '#F1F5F9' : '#1E2939'
    const borderColor = isDark ? alpha('#FFFFFF', 0.3) : '#CAD5E2'
    const hoverBorder = isDark ? alpha('#FFFFFF', 0.5) : '#94A3B8'
    const focusBorder = theme.palette.primary.main
    const bgColor = isDark ? alpha(theme.palette.background.paper, 0.5) : '#FFFFFF'

    return {
      labelSx: {
        color: labelColor,
        fontFamily: 'Outfit',
        fontWeight: 400,
        fontStyle: 'normal',
        fontSize: '12px',
        letterSpacing: 0,
        '&.Mui-focused': { color: focusBorder },
      },
      valueSx: {
        color: inputColor,
        fontFamily: 'Outfit',
        fontWeight: 400,
        fontStyle: 'normal',
        fontSize: '14px',
        letterSpacing: 0,
        wordBreak: 'break-word',
        '& .MuiInputBase-input::placeholder': {
          color: isDark ? alpha('#FFFFFF', 0.5) : undefined,
          opacity: 1,
        },
      },
      commonFieldStyles: {
        height: '46px',
        '& .MuiOutlinedInput-root': {
          height: '46px',
          borderRadius: '8px',
          backgroundColor: bgColor,
          '& fieldset': {
            borderColor,
            borderWidth: '1px',
          },
          '&:hover fieldset': {
            borderColor: hoverBorder,
          },
          '&.Mui-focused fieldset': {
            borderColor: focusBorder,
            borderWidth: '1px',
          },
          '& .MuiInputBase-input': {
            color: inputColor,
          },
        },
      },
      dividerColor: isDark ? alpha('#FFFFFF', 0.4) : '#9CA3AF',
    }
  }, [theme, isDark])

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className={`date-range-picker flex gap-2 ${className}`}>
        <DatePicker
          label="Start Date"
          value={dayjs(startDate, 'DD-MM-YYYY')}
          onChange={handleStartDateChange}
          format="DD-MM-YYYY"
          slots={{
            openPickerIcon: CalendarTodayOutlined,
          }}
          slotProps={{
            textField: {
              fullWidth: true,
              sx: commonFieldStyles,
              InputLabelProps: { sx: labelSx },
              InputProps: {
                sx: valueSx,
                style: { height: '46px' },
              },
            },
          }}
        />

        <span className="flex items-center" style={{ color: dividerColor }}>|</span>

        <DatePicker
          label="End Date"
          value={dayjs(endDate, 'DD-MM-YYYY')}
          onChange={handleEndDateChange}
          format="DD-MM-YYYY"
          slots={{
            openPickerIcon: CalendarTodayOutlined,
          }}
          slotProps={{
            textField: {
              fullWidth: true,
              sx: commonFieldStyles,
              InputLabelProps: { sx: labelSx },
              InputProps: {
                sx: valueSx,
                style: { height: '46px' },
              },
            },
          }}
        />
      </div>
    </LocalizationProvider>
  )
}
