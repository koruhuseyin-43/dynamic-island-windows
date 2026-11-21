$code = @'
using System;
using System.Runtime.InteropServices;
public class MediaCtrl {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
    public static void Send(int key) {
        keybd_event((byte)key, 0, 0, UIntPtr.Zero);
        keybd_event((byte)key, 0, 2, UIntPtr.Zero);
    }
}
'@
Add-Type -TypeDefinition $code -Language CSharp
[MediaCtrl]::Send([int]$args[0])
