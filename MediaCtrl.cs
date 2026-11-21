using System;
using System.Runtime.InteropServices;

class Program {
    [DllImport("user32.dll")]
    static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    static void Main(string[] args) {
        if (args.Length == 0) return;
        string cmd = args[0].ToLower();
        byte code = 0;
        if (cmd == "playpause" || cmd == "play" || cmd == "pause") code = 0xB3;
        else if (cmd == "next") code = 0xB0;
        else if (cmd == "prev" || cmd == "previous") code = 0xB1;

        if (code != 0) {
            keybd_event(code, 0, 0, UIntPtr.Zero);
            keybd_event(code, 0, 2, UIntPtr.Zero);
        }
    }
}
