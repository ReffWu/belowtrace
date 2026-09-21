"""Composite an iPhone screenshot into an appshot device frame.

The screenshot is clipped to the screen's rounded corners first: the frame PNG is transparent
outside the device, so square corners would otherwise poke out past the bezel.
"""
import sys, AppKit, Quartz

FRAME = "/Users/reff/Documents/opencode/appshot/assets/frames/iOS/Air/Air - Space Black.png"
INSET = 100      # appshot src/frames.ts: screen is the canvas inset by 100 on every side
RADIUS = 132     # screen corner radius at this scale

def frame_shot(shot_path, out_path):
    frame = AppKit.NSImage.alloc().initWithContentsOfFile_(FRAME)
    shot = AppKit.NSImage.alloc().initWithContentsOfFile_(shot_path)
    fw, fh = frame.size().width, frame.size().height
    sw, sh = fw - 2 * INSET, fh - 2 * INSET

    canvas = AppKit.NSImage.alloc().initWithSize_(AppKit.NSMakeSize(fw, fh))
    canvas.lockFocus()
    ctx = AppKit.NSGraphicsContext.currentContext()
    ctx.setImageInterpolation_(AppKit.NSImageInterpolationHigh)

    ctx.saveGraphicsState()
    AppKit.NSBezierPath.bezierPathWithRoundedRect_xRadius_yRadius_(
        AppKit.NSMakeRect(INSET, INSET, sw, sh), RADIUS, RADIUS).addClip()
    iw, ih = shot.size().width, shot.size().height
    scale = sw / iw
    drawn_h = ih * scale
    shot.drawInRect_fromRect_operation_fraction_(
        AppKit.NSMakeRect(INSET, fh - INSET - drawn_h, sw, drawn_h),
        AppKit.NSZeroRect, AppKit.NSCompositingOperationSourceOver, 1.0)
    ctx.restoreGraphicsState()

    frame.drawInRect_fromRect_operation_fraction_(
        AppKit.NSMakeRect(0, 0, fw, fh), AppKit.NSZeroRect, AppKit.NSCompositingOperationSourceOver, 1.0)
    canvas.unlockFocus()

    rep = AppKit.NSBitmapImageRep.imageRepWithData_(canvas.TIFFRepresentation())
    rep.representationUsingType_properties_(AppKit.NSBitmapImageFileTypePNG, {}).writeToFile_atomically_(out_path, True)
    print(f"{out_path}  {int(fw)}x{int(fh)}")

for i in range(1, len(sys.argv), 2):
    frame_shot(sys.argv[i], sys.argv[i + 1])
