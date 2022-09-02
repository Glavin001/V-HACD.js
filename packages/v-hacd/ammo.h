#define ENABLE_VHACD_IMPLEMENTATION 1
#define VHACD_DISABLE_THREADING 1
// #include "include/VHACD.h"
#include "src/lib/v-hacd/include/VHACD.h"

// namespace VHACD {
//     class IVHACD {
//         public:
//             class JsHelpers {
//                 public:
//                     IVHACD* CreateVHACD(void) {
//                         return CreateVHACD();
//                     }
//                     IVHACD* CreateVHACD_ASYNC(void) {
//                         return CreateVHACD_ASYNC();
//                     }
//             };
//     };
// };

class AmmoHelpers;

class AmmoHelpers {
    public:
        AmmoHelpers(void) {
        }
        VHACD::IVHACD* CreateVHACD(void) {
            return VHACD::CreateVHACD();
        }
		#if !VHACD_DISABLE_THREADING
        VHACD::IVHACD* CreateVHACD_ASYNC(void) {
            return VHACD::CreateVHACD_ASYNC();
        }
		#endif
};

// https://github.com/emscripten-core/emscripten/issues/5587#issuecomment-429085470
// namespace emscripten {
//     namespace internal {
//         template<> void raw_destructor<IVHACD>(IVHACD* ptr) { /* do nothing */ }
//     }
// }

class Logging : public VHACD::IVHACD::IUserCallback, public VHACD::IVHACD::IUserLogger
{
public:
	Logging(void)
	{
	}

	~Logging(void)
	{
		flushMessages();
	}

        // Be aware that if you are running V-HACD asynchronously (in a background thread) this callback will come from
        // a different thread. So if your print/logging code isn't thread safe, take that into account.
        virtual void Update(const double overallProgress,
                            const double stageProgress,
                            const char* const stage,const char *operation) final
		{
			char scratch[512];
			snprintf(scratch,sizeof(scratch),"[%-40s] : %0.0f%% : %0.0f%% : %s",stage,overallProgress,stageProgress,operation);

			if ( strcmp(stage,mCurrentStage.c_str()) == 0 )
			{
				for (uint32_t i=0; i<mLastLen; i++)
				{
					printf("%c", 8);
				}
			}
			else
			{
				printf("\n");
				mCurrentStage = std::string(stage);
			}
			mLastLen = (uint32_t)strlen(scratch);
			printf("%s", scratch);
		}

        // This is an optional user callback which is only called when running V-HACD asynchronously.
        // This is a callback performed to notify the user that the
        // convex decomposition background process is completed. This call back will occur from
        // a different thread so the user should take that into account.
        virtual void NotifyVHACDComplete(void)
        {
			Log("VHACD::Complete");
        }

		virtual void Log(const char* const msg) final
		{
			mLogMessages.push_back(std::string(msg));
		}

		void flushMessages(void)
		{
			if ( !mLogMessages.empty() )
			{
				printf("\n");
				for (auto &i:mLogMessages)
				{
					printf("%s\n", i.c_str());
				}
				mLogMessages.clear();
			}
		}

		uint32_t	mLastLen{0};
		std::string mCurrentStage;
		std::vector< std::string > mLogMessages;

};
