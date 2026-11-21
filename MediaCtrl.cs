using System;
using System.Runtime.InteropServices;

class Program {
    [DllImport("user32.dll")]
    static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    static void Main(string[] args) {
        if (args.Length == 0) return;
        string cmd = args[0].ToLower();
        byte code = 0;
        
        // Media Keys
        if (cmd == "playpause" || cmd == "play" || cmd == "pause") code = 0xB3;
        else if (cmd == "next") code = 0xB0;
        else if (cmd == "prev" || cmd == "previous") code = 0xB1;
        // Fullscreen (F11)
        else if (cmd == "fullscreen" || cmd == "f11") code = 0x7A;
        // Volume
        else if (cmd == "volup") code = 0xAF;
        else if (cmd == "voldown") code = 0xAE;
        else if (cmd == "mute") code = 0xAD;

        if (code != 0) {
            keybd_event(code, 0, 0, UIntPtr.Zero);
            keybd_event(code, 0, 2, UIntPtr.Zero);
        }
    }
}
