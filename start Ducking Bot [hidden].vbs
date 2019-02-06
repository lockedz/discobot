Dim WinScriptHost
Set WinScriptHost = CreateObject("WScript.Shell")
WinScriptHost.Run Chr(34) & "C:\Users\artur\Desktop\start Ducking Bot.bat" & Chr(34), 0
Set WinScriptHost = Nothing

MsgBox "Bot has started running in the background", vbInformation, "Information"