// Shared by SongRow and the SongList header so their columns always line up.
// Mobile: # | title | heart | menu     Desktop: # | title | [album] | heart | duration | menu
export const songGridCols = (showAlbum) =>
  showAlbum
    ? "grid-cols-[2rem_1fr_2rem_2rem] md:grid-cols-[2rem_4fr_3fr_2rem_auto_2rem]"
    : "grid-cols-[2rem_1fr_2rem_2rem] md:grid-cols-[2rem_1fr_2rem_auto_2rem]";
