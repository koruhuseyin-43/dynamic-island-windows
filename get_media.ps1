[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

function Get-MediaSession {
    try {
        Add-Type -AssemblyName System.Runtime.WindowsRuntime
        $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
        
        $AwaitFunc = {
            param($WinRtTask, $ResultType)
            $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
            $netTask = $asTask.Invoke($null, @($WinRtTask))
            $netTask.Wait(-1) | Out-Null
            $netTask.Result
        }

        [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media, ContentType = WindowsRuntime] | Out-Null
        $manager = & $AwaitFunc ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager])
        
        $sessions = $manager.GetSessions()
        $targetSession = $null
        foreach ($s in $sessions) {
            if ($s.SourceAppId -like '*Spotify*') { $targetSession = $s; break }
        }
        if (-not $targetSession) { $targetSession = $manager.GetCurrentSession() }

        if ($targetSession) {
            $mediaProperties = & $AwaitFunc ($targetSession.TryGetMediaPropertiesAsync()) ([Windows.Media.Control.GlobalSystemMediaTransportControlsSessionMediaProperties])
            $timeline = $targetSession.GetTimelineProperties()
            $playbackInfo = $targetSession.GetPlaybackInfo()
            
            $pos = -1
            if ($timeline -and $timeline.Position) {
                $pos = [math]::Round($timeline.Position.TotalSeconds)
            }
            $dur = -1
            if ($timeline -and $timeline.EndTime) {
                $dur = [math]::Round($timeline.EndTime.TotalSeconds)
            }

            $status = 'Paused'
            if ($playbackInfo -and $playbackInfo.PlaybackStatus) {
                $status = $playbackInfo.PlaybackStatus.ToString()
            }

            if ($mediaProperties.Title) {
                return @{
                    isRunning = $true
                    title = $mediaProperties.Title
                    artist = $mediaProperties.Artist
                    albumTitle = $mediaProperties.AlbumTitle
                    position = $pos
                    duration = $dur
                    isPlaying = ($status -eq 'Playing')
                    status = $status
                }
            }
        }
    } catch {}
    return $null
}

function Emit-Result($obj) {
    $json = $obj | ConvertTo-Json -Compress
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    [Convert]::ToBase64String($bytes)
}

$gsmtc = Get-MediaSession
if ($gsmtc) {
    Emit-Result $gsmtc
    exit
}

# Fallback: Spotify Process Title
$spotify = Get-Process -Name spotify -ErrorAction SilentlyContinue
if (-not $spotify) {
    Emit-Result @{
        isRunning = $false
        title = "Spotify Kapalı"
        artist = "Başlatmak için ▶ tıkla"
        isPlaying = $false
        position = -1
        duration = -1
        status = "STOPPED"
    }
} else {
    $songProc = $spotify | Where-Object { $_.MainWindowTitle -and $_.MainWindowTitle.Contains(' - ') } | Select-Object -First 1
    if ($songProc) {
        $t = $songProc.MainWindowTitle
        $idx = $t.IndexOf(' - ')
        $artist = $t.Substring(0, $idx).Trim()
        $title = $t.Substring($idx + 3).Trim()
        Emit-Result @{
            isRunning = $true
            title = $title
            artist = $artist
            isPlaying = $true
            position = -1
            duration = -1
            status = 'Playing'
        }
    } else {
        Emit-Result @{
            isRunning = $true
            title = 'Spotify Beklemede'
            artist = 'Çalmak için ▶ tıkla'
            isPlaying = $false
            position = -1
            duration = -1
            status = 'IDLE'
        }
    }
}
